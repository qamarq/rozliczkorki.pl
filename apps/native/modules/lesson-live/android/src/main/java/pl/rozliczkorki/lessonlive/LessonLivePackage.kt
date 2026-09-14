package pl.rozliczkorki.lessonlive

import android.app.Application
import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

class LessonLivePackage : Package {
  override fun createApplicationLifecycleListeners(
    context: Context,
  ): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        // Must run before expo-live-updates creates the channel with a default sound.
        override fun onCreate(application: Application) {
          LessonLiveScheduler.ensureChannel(application)
        }
      },
    )
}
