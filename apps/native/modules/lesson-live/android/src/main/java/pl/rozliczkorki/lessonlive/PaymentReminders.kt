package pl.rozliczkorki.lessonlive

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject

object PaymentReminders {
  const val ACTION_CHECK = "pl.rozliczkorki.lessonlive.PAYMENT_REMINDERS"
  private const val CHANNEL_ID = "overdue-payments"
  private const val NOTIFICATION_TAG = "payment-reminder"
  private const val PREFS_NAME = "payment-reminders"
  private const val KEY_REMINDERS = "reminders"
  private const val KEY_API_URL = "apiUrl"
  private const val KEY_LESSON_URL = "lessonUrl"
  private const val KEY_COOKIE = "cookie"
  private const val ALARM_REQUEST_CODE = 1
  private const val RETRY_MS = 15 * 60_000L
  private const val GIVE_UP_MS = 24 * 60 * 60_000L
  private const val RESCHEDULE_MARGIN_MS = 60_000L
  private const val TIMEOUT_MS = 8_000
  private const val MAX_IDS_PER_CHECK = 100

  private val lock = Any()
  private val executor = Executors.newSingleThreadExecutor()

  private data class Reminder(
    val id: String,
    val studentName: String,
    val startsAt: Long,
    val fireAt: Long,
    val nextAttemptAt: Long,
  )

  private data class Status(val startsAt: Long, val unpaid: Boolean)

  private sealed interface CheckResult {
    data class Statuses(val byId: Map<String, Status>) : CheckResult

    data object SignedOut : CheckResult

    data object Unverifiable : CheckResult

    data object Failed : CheckResult
  }

  fun sync(context: Context, json: String) {
    val payload = runCatching { JSONObject(json) }.getOrNull() ?: return
    val now = System.currentTimeMillis()
    synchronized(lock) {
      val prefs = prefs(context)
      val incoming = parseReminders(payload.optJSONArray("reminders")).filter { it.fireAt > now }
      val incomingIds = incoming.map { it.id }.toSet()
      val pending = readReminders(prefs).filter { it.fireAt <= now && it.id !in incomingIds }
      val reminders = incoming + pending
      val cookie = payload.optString("cookie").takeIf { it.isNotEmpty() }?.let(CookieVault::encrypt)
      val editor =
        prefs
          .edit()
          .putString(KEY_REMINDERS, toJson(reminders))
          .putString(KEY_API_URL, payload.optString("apiUrl"))
          .putString(KEY_LESSON_URL, payload.optString("lessonUrl"))
      if (cookie == null) editor.remove(KEY_COOKIE) else editor.putString(KEY_COOKIE, cookie)
      editor.commit()
      scheduleNext(context, reminders)
    }
  }

  fun clear(context: Context) {
    synchronized(lock) {
      prefs(context).edit().clear().commit()
      scheduleNext(context, emptyList())
    }
  }

  fun reschedule(context: Context) {
    synchronized(lock) { scheduleNext(context, readReminders(prefs(context))) }
  }

  fun check(context: Context, pendingResult: BroadcastReceiver.PendingResult) {
    val appContext = context.applicationContext
    executor.execute {
      try {
        runCheck(appContext)
      } finally {
        pendingResult.finish()
      }
    }
  }

  private fun runCheck(context: Context) {
    val now = System.currentTimeMillis()
    val prefs = prefs(context)
    val due: List<Reminder>
    val apiUrl: String?
    val cookie: String?
    synchronized(lock) {
      due = readReminders(prefs).filter { it.nextAttemptAt <= now }.take(MAX_IDS_PER_CHECK)
      apiUrl = prefs.getString(KEY_API_URL, null)
      cookie = prefs.getString(KEY_COOKIE, null)?.let(CookieVault::decrypt)
    }
    val result = if (due.isEmpty()) null else fetchStatuses(apiUrl, cookie, due.map { it.id })
    val dueIds = due.map { it.id }.toSet()

    synchronized(lock) {
      val lessonUrl = prefs.getString(KEY_LESSON_URL, null)
      val remaining = mutableListOf<Reminder>()
      for (reminder in readReminders(prefs)) {
        if (reminder.id !in dueIds || reminder.nextAttemptAt > now) {
          remaining += reminder
          continue
        }
        when (result) {
          is CheckResult.Statuses -> {
            val status = result.byId[reminder.id] ?: continue
            if (!status.unpaid) continue
            val fireAt = status.startsAt + (reminder.fireAt - reminder.startsAt)
            if (fireAt > now + RESCHEDULE_MARGIN_MS) {
              remaining +=
                reminder.copy(startsAt = status.startsAt, fireAt = fireAt, nextAttemptAt = fireAt)
            } else {
              notify(context, reminder.copy(startsAt = status.startsAt), lessonUrl)
            }
          }
          CheckResult.SignedOut -> continue
          CheckResult.Unverifiable -> notify(context, reminder, lessonUrl)
          CheckResult.Failed,
          null ->
            if (now - reminder.fireAt < GIVE_UP_MS) {
              remaining += reminder.copy(nextAttemptAt = now + RETRY_MS)
            }
        }
      }
      prefs.edit().putString(KEY_REMINDERS, toJson(remaining)).commit()
      scheduleNext(context, remaining)
    }
  }

  private fun fetchStatuses(apiUrl: String?, cookie: String?, ids: List<String>): CheckResult {
    if (apiUrl.isNullOrEmpty() || cookie.isNullOrEmpty()) return CheckResult.Unverifiable
    return runCatching {
        val input = JSONObject().put("json", JSONObject().put("ids", JSONArray(ids)))
        val query = URLEncoder.encode(input.toString(), "UTF-8")
        val url = URL("${apiUrl.trimEnd('/')}/api/trpc/lessons.paymentStatus?input=$query")
        val connection = url.openConnection() as HttpURLConnection
        try {
          connection.connectTimeout = TIMEOUT_MS
          connection.readTimeout = TIMEOUT_MS
          connection.setRequestProperty("cookie", cookie)
          connection.setRequestProperty("accept", "application/json")
          when (connection.responseCode) {
            HttpURLConnection.HTTP_OK -> {
              val body = connection.inputStream.bufferedReader().use { it.readText() }
              parseStatuses(body)?.let { CheckResult.Statuses(it) } ?: CheckResult.Failed
            }
            HttpURLConnection.HTTP_UNAUTHORIZED,
            HttpURLConnection.HTTP_FORBIDDEN -> CheckResult.SignedOut
            else -> CheckResult.Failed
          }
        } finally {
          connection.disconnect()
        }
      }
      .getOrDefault(CheckResult.Failed)
  }

  private fun parseStatuses(body: String): Map<String, Status>? =
    runCatching {
        val array = JSONObject(body).getJSONObject("result").getJSONObject("data").getJSONArray("json")
        (0 until array.length()).associate { index ->
          val item = array.getJSONObject(index)
          item.getString("id") to Status(item.getLong("startsAt"), item.getBoolean("unpaid"))
        }
      }
      .getOrNull()

  @SuppressLint("MissingPermission")
  private fun notify(context: Context, reminder: Reminder, lessonUrl: String?) {
    val manager = NotificationManagerCompat.from(context)
    if (!hasPermission(context) || !manager.areNotificationsEnabled()) return
    ensureChannel(context)
    val date =
      SimpleDateFormat("dd.MM.yyyy", Locale.forLanguageTag("pl-PL")).format(Date(reminder.startsAt))
    val text = "${reminder.studentName} — zajęcia z $date wciąż nie są oznaczone jako opłacone."
    val builder =
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(smallIcon(context))
        .setContentTitle("Zaległa płatność za zajęcia")
        .setContentText(text)
        .setStyle(NotificationCompat.BigTextStyle().bigText(text))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setCategory(NotificationCompat.CATEGORY_REMINDER)
        .setAutoCancel(true)
    accentColor(context)?.let { builder.setColor(it) }
    openLessonIntent(context, reminder.id, lessonUrl)?.let { builder.setContentIntent(it) }
    manager.notify(NOTIFICATION_TAG, reminder.id.hashCode(), builder.build())
  }

  private fun openLessonIntent(context: Context, lessonId: String, lessonUrl: String?): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    intent.action = Intent.ACTION_VIEW
    if (!lessonUrl.isNullOrEmpty()) intent.data = Uri.parse("${lessonUrl.trimEnd('/')}/$lessonId")
    return PendingIntent.getActivity(
      context,
      lessonId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel =
      NotificationChannel(CHANNEL_ID, "Zaległe płatności", NotificationManager.IMPORTANCE_HIGH)
        .apply {
          description = "Przypomnienia o zajęciach, które wciąż nie są oznaczone jako opłacone."
        }
    manager.createNotificationChannel(channel)
  }

  @SuppressLint("DiscouragedApi")
  private fun smallIcon(context: Context): Int =
    context.resources
      .getIdentifier("notification_icon", "drawable", context.packageName)
      .takeIf { it != 0 } ?: context.applicationInfo.icon

  @SuppressLint("DiscouragedApi")
  private fun accentColor(context: Context): Int? =
    context.resources
      .getIdentifier("notification_icon_color", "color", context.packageName)
      .takeIf { it != 0 }
      ?.let { ContextCompat.getColor(context, it) }

  private fun scheduleNext(context: Context, reminders: List<Reminder>) {
    val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
    val intent = Intent(context, LessonLiveReceiver::class.java).setAction(ACTION_CHECK)
    val pendingIntent =
      PendingIntent.getBroadcast(
        context,
        ALARM_REQUEST_CODE,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    val at = reminders.minOfOrNull { it.nextAttemptAt }
    if (at == null) {
      alarmManager.cancel(pendingIntent)
      return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
      alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
    } else {
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent)
    }
  }

  private fun hasPermission(context: Context) =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun parseReminders(array: JSONArray?): List<Reminder> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { index ->
      val item = array.optJSONObject(index) ?: return@mapNotNull null
      val fireAt = item.optLong("fireAt")
      Reminder(
          id = item.optString("id"),
          studentName = item.optString("studentName"),
          startsAt = item.optLong("startsAt"),
          fireAt = fireAt,
          nextAttemptAt = item.optLong("nextAttemptAt", fireAt),
        )
        .takeIf { it.id.isNotEmpty() && it.fireAt > 0 }
    }
  }

  private fun readReminders(prefs: SharedPreferences): List<Reminder> =
    parseReminders(
      runCatching { JSONArray(prefs.getString(KEY_REMINDERS, null) ?: "[]") }.getOrNull()
    )

  private fun toJson(reminders: List<Reminder>): String =
    JSONArray(
        reminders.map {
          JSONObject()
            .put("id", it.id)
            .put("studentName", it.studentName)
            .put("startsAt", it.startsAt)
            .put("fireAt", it.fireAt)
            .put("nextAttemptAt", it.nextAttemptAt)
        }
      )
      .toString()
}
