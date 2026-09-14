package pl.rozliczkorki.lessonlive

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.liveupdates.LiveUpdateConfig
import expo.modules.liveupdates.LiveUpdateImage
import expo.modules.liveupdates.LiveUpdateProgress
import expo.modules.liveupdates.LiveUpdateProgressSegment
import expo.modules.liveupdates.LiveUpdateState
import expo.modules.liveupdates.LiveUpdatesManager
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

object LessonLiveScheduler {
  private const val ACTION_REFRESH = "pl.rozliczkorki.lessonlive.REFRESH"
  private const val CHANNEL_ID = "lesson-live"
  private const val PREFS_NAME = "lesson-live"
  private const val KEY_LESSONS = "lessons"
  private const val KEY_ACTIVE = "active"
  private const val KEY_DISMISSED = "dismissed"
  private const val TICK_MS = 60_000L
  private const val WRAP_UP_MS = 20 * 60_000L
  private const val ACCENT = "#8B5CF6"
  private const val WRAP_UP_COLOR = "#34D399"
  private data class Lesson(
    val id: String,
    val studentName: String,
    val startsAt: Long,
    val endsAt: Long,
    val paid: Boolean,
  )

  private enum class Phase {
    IN_PROGRESS,
    WRAP_UP,
  }

  fun saveLessons(context: Context, json: String) {
    prefs(context).edit().putString(KEY_LESSONS, json).apply()
  }

  fun resetActive(context: Context) {
    prefs(context).edit().remove(KEY_ACTIVE).apply()
  }

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel =
      NotificationChannel(CHANNEL_ID, "Trwające zajęcia", NotificationManager.IMPORTANCE_DEFAULT)
        .apply {
          description = "Postęp trwających zajęć i przypomnienie o płatności tuż po nich."
          setSound(null, null)
          enableVibration(false)
        }
    manager.createNotificationChannel(channel)
  }

  fun canPostPromoted(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.BAKLAVA) return true
    return try {
      context.getSystemService(NotificationManager::class.java)?.canPostPromotedNotifications()
        ?: true
    } catch (e: Throwable) {
      true
    }
  }

  @SuppressLint("MissingPermission")
  fun refresh(context: Context) {
    ensureChannel(context)
    val prefs = prefs(context)
    val lessons = readLessons(prefs)
    val active = readActive(prefs)
    val dismissed = readDismissed(prefs)
    val notificationManager = NotificationManagerCompat.from(context)
    val visible = notificationManager.activeNotifications.map { it.id }.toSet()
    val canPost = hasPermission(context) && notificationManager.areNotificationsEnabled()
    val liveUpdates = LiveUpdatesManager(context)
    val now = System.currentTimeMillis()
    val shown = mutableSetOf<String>()
    var nextWake = Long.MAX_VALUE

    for (lesson in lessons) {
      val wrapUpEndsAt = lesson.endsAt + WRAP_UP_MS
      val phase =
        when {
          now < lesson.startsAt -> {
            nextWake = minOf(nextWake, lesson.startsAt)
            null
          }
          now < lesson.endsAt -> {
            nextWake = minOf(nextWake, now + TICK_MS, lesson.endsAt)
            Phase.IN_PROGRESS
          }
          !lesson.paid && now < wrapUpEndsAt -> {
            nextWake = minOf(nextWake, wrapUpEndsAt)
            Phase.WRAP_UP
          }
          else -> null
        }
      if (phase == null || !canPost || lesson.id in dismissed) continue

      val state = buildState(context, lesson, phase, now)
      val config = LiveUpdateConfig(deepLinkUrl = "lesson/${lesson.id}")
      val notificationId = active[lesson.id]
      when {
        notificationId == null ->
          liveUpdates.startLiveUpdateNotification(state, config)?.let {
            active[lesson.id] = it
            shown += lesson.id
          }
        notificationId in visible -> {
          liveUpdates.updateLiveUpdateNotification(notificationId, state, config)
          shown += lesson.id
        }
        else -> dismissed += lesson.id
      }
    }

    active.entries.removeAll { (lessonId, notificationId) ->
      val stale = lessonId !in shown
      if (stale && notificationId in visible) liveUpdates.stopNotification(notificationId)
      stale
    }
    dismissed.retainAll(lessons.map { it.id }.toSet())

    prefs
      .edit()
      .putString(KEY_ACTIVE, JSONObject(active.toMap()).toString())
      .putString(KEY_DISMISSED, JSONArray(dismissed.toList()).toString())
      .apply()
    scheduleWake(context, nextWake.takeIf { it != Long.MAX_VALUE })
  }

  private fun buildState(
    context: Context,
    lesson: Lesson,
    phase: Phase,
    now: Long,
  ): LiveUpdateState {
    val lessonMinutes = ((lesson.endsAt - lesson.startsAt) / 60_000L).toInt().coerceAtLeast(1)
    val wrapUpMinutes = if (lesson.paid) 0 else (WRAP_UP_MS / 60_000L).toInt()
    val totalMinutes = lessonMinutes + wrapUpMinutes
    val elapsed = ((now - lesson.startsAt) / 60_000L).toInt().coerceIn(0, totalMinutes)
    val range = "${formatTime(lesson.startsAt)}–${formatTime(lesson.endsAt)}"
    val segments = arrayListOf(LiveUpdateProgressSegment(lessonMinutes, ACCENT))
    if (wrapUpMinutes > 0) segments += LiveUpdateProgressSegment(wrapUpMinutes, WRAP_UP_COLOR)
    val progress = LiveUpdateProgress(totalMinutes, elapsed, false, segments = segments)

    return when (phase) {
      Phase.IN_PROGRESS ->
        LiveUpdateState(
          title = lesson.studentName,
          text = "Trwają zajęcia · $range · zostało ${lessonMinutes - elapsed} min",
          icon = icon(context),
          progress = progress,
          time = lesson.endsAt,
        )
      Phase.WRAP_UP ->
        LiveUpdateState(
          title = lesson.studentName,
          text = "Zajęcia zakończone ($range) · dodaj notatkę i oznacz płatność",
          icon = icon(context),
          progress = progress,
          shortCriticalText = "Notatki",
          time = lesson.endsAt + WRAP_UP_MS,
        )
    }
  }

  private fun icon(context: Context): LiveUpdateImage? {
    val file = File(context.cacheDir, "lesson_live_icon.png")
    if (!file.exists()) {
      val resId =
        context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      if (resId == 0) return null
      val bitmap = BitmapFactory.decodeResource(context.resources, resId) ?: return null
      file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
    return LiveUpdateImage(file.absolutePath, false)
  }

  private fun formatTime(millis: Long): String =
    SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(millis))

  private fun scheduleWake(context: Context, at: Long?) {
    val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
    val intent = Intent(context, LessonLiveReceiver::class.java).setAction(ACTION_REFRESH)
    val pendingIntent =
      PendingIntent.getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
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

  private fun readLessons(prefs: SharedPreferences): List<Lesson> {
    val array =
      runCatching { JSONArray(prefs.getString(KEY_LESSONS, null) ?: "[]") }
        .getOrElse { JSONArray() }
    return (0 until array.length()).mapNotNull { index ->
      val item = array.optJSONObject(index) ?: return@mapNotNull null
      Lesson(
          id = item.optString("id"),
          studentName = item.optString("studentName"),
          startsAt = item.optLong("startsAt"),
          endsAt = item.optLong("endsAt"),
          paid = item.optBoolean("paid"),
        )
        .takeIf { it.id.isNotEmpty() && it.endsAt > it.startsAt }
    }
  }

  private fun readActive(prefs: SharedPreferences): MutableMap<String, Int> {
    val json =
      runCatching { JSONObject(prefs.getString(KEY_ACTIVE, null) ?: "{}") }
        .getOrElse { JSONObject() }
    return json.keys().asSequence().associateWith { json.optInt(it) }.toMutableMap()
  }

  private fun readDismissed(prefs: SharedPreferences): MutableSet<String> {
    val array =
      runCatching { JSONArray(prefs.getString(KEY_DISMISSED, null) ?: "[]") }
        .getOrElse { JSONArray() }
    return (0 until array.length()).map { array.optString(it) }.toMutableSet()
  }
}
