package pl.rozliczkorki.lessonlive

import android.content.ActivityNotFoundException
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LessonLiveModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LessonLive")

    Function("sync") { lessonsJson: String ->
      val context = appContext.reactContext ?: return@Function
      LessonLiveScheduler.saveLessons(context, lessonsJson)
      LessonLiveScheduler.refresh(context)
    }

    Function("canPostPromotedNotifications") {
      val context = appContext.reactContext ?: return@Function true
      LessonLiveScheduler.canPostPromoted(context)
    }

    Function("openPromotedNotificationSettings") {
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent("android.settings.APP_NOTIFICATION_PROMOTION_SETTINGS")
        .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
        true
      } catch (e: ActivityNotFoundException) {
        false
      }
    }
  }
}
