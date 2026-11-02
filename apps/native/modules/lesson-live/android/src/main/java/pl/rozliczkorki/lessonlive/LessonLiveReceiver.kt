package pl.rozliczkorki.lessonlive

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class LessonLiveReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      PaymentReminders.ACTION_CHECK -> {
        PaymentReminders.check(context, goAsync())
        return
      }
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> {
        LessonLiveScheduler.resetActive(context)
        PaymentReminders.reschedule(context)
      }
    }
    LessonLiveScheduler.refresh(context)
  }
}
