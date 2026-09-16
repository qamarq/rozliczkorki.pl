# Native

A [react-native](https://reactnative.dev/) app built using [expo](https://docs.expo.dev/).

## Prerequisites

- Android SDK at `$ANDROID_HOME` (defaults to `~/Library/Android/sdk` if unset)
- A JDK (Temurin/OpenJDK 21 works)
- `android-signing/release.keystore` + `android-signing/keystore.properties` present
  (gitignored — release builds fall back to the debug keystore if missing, which
  produces an APK/AAB that can't be installed over a real release build or uploaded
  to Play)
- `.env` with at least `EXPO_PUBLIC_API_URL` (see `.env.example`) for local dev/testing
  builds — production builds override this, see below

## Building a test APK (arm64, installed via adb)

```bash
bash scripts/build-android-release-apk.sh
```

This runs `expo prebuild` (regenerates `android/`), points the build at
`EXPO_PUBLIC_API_URL` from your `.env` (or `https://rozliczkorki.pl` if unset —
pass an explicit `EXPO_PUBLIC_API_URL=...` env var to target something else,
e.g. a local dev server's LAN IP), and runs `./gradlew assembleRelease`.

Output: `android/app/build/outputs/apk/release/app-release.apk`

Install and launch on a connected/emulated device:

```bash
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p pl.rozliczkorki.app -c android.intent.category.LAUNCHER 1
```

Useful while iterating on a device:

```bash
adb exec-out screencap -p > /tmp/screen.png   # screenshot
adb logcat -d | grep -i ReactNativeJS         # JS-side logs/errors
```

## Building a production AAB (Play Store)

```bash
bash scripts/build-android-release.sh
```

Same flow as the APK script, but always targets `https://rozliczkorki.pl`
(regardless of `.env`) and runs `./gradlew bundleRelease`.

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**`.env` gotcha:** both scripts temporarily overwrite `.env` with the production
API URL for the duration of the build, backing up your existing `.env` to
`.env.local-backup` and restoring it on exit (even on failure, via `trap`). If a
previous run was killed hard enough to skip the trap, you may find `.env` still
pointing at production and/or a stale `.env.local-backup` lying around — check
`.env` and restore your local URL by hand if so.

## CI release to Google Play

`.github/workflows/android-release.yml` builds the production AAB and uploads it
to the Play **internal** track on every push to `main` that touches the app (or
manually via _Run workflow_). Promote to production by hand in Play Console.

- `versionCode` is set in CI to `100 + run number` — don't bump it by hand in
  `app.json` anymore. `versionName` still comes from `expo.version` in `app.json`.
- Required repository secrets:
  - `ANDROID_KEYSTORE_BASE64` — `base64 -i android-signing/release.keystore`
  - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` —
    from `android-signing/keystore.properties`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `PLAY_SERVICE_ACCOUNT_JSON` — JSON key of a Google Cloud service account
    invited in Play Console (_Users and permissions_) with release permissions
    for the app

## CI release to TestFlight

`.github/workflows/ios-release.yml` regenerates the iOS project, signs it with
Fastlane Match, and uploads the IPA to TestFlight **internal** testing on every
push to `main` that touches the app (or manually via _Run workflow_). Promote a
tested build to the App Store manually.

The iOS project remains generated and gitignored. Fastlane configuration lives
in this directory so it survives `expo prebuild`.

### One-time signing bootstrap

1. Enrol in the Apple Developer Program, create the explicit App ID
   `pl.rozliczkorki.app`, and enable Sign in with Apple, Associated Domains,
   and Push Notifications.
2. Create the App Store Connect record for the same bundle ID.
3. Create an App Store Connect API key and retain its key ID, issuer ID, and
   downloaded `.p8` file. This is separate from the Sign in with Apple key.
4. Use the private signing repository
   `simon-the-shark/ios-encrypted-certy-do-apki-kamilka` and configure its
   encryption password as `MATCH_PASSWORD`.
5. On a Mac with your Apple Developer credentials, run the initial Match setup
   from this directory. It creates the App Store certificate and provisioning
   profile in the signing repository. CI uses `readonly` Match and cannot
   create or modify signing material.

   ```bash
   bundle install
   export APPLE_DEVELOPER_TEAM_ID=YOUR_TEAM_ID
   export MATCH_PASSWORD=YOUR_MATCH_PASSWORD
   bundle exec fastlane match appstore
   ```

6. Create a read-only GitHub deploy key on the signing repository and store its
   private half as `MATCH_GIT_PRIVATE_KEY` in this repository.

### Required repository secrets

- `MATCH_GIT_PRIVATE_KEY` — read-only deploy key for the Match signing repo
- `MATCH_PASSWORD` — signing repository encryption password
- `APPLE_DEVELOPER_TEAM_ID` — Apple Developer Team ID
- `APP_STORE_CONNECT_API_KEY_P8_B64` — base64-encoded App Store Connect API
  key `.p8` file
- `APP_STORE_CONNECT_API_KEY_KEY_ID` and `APP_STORE_CONNECT_API_KEY_ISSUER_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` — reversed iOS OAuth client ID, for
  example `com.googleusercontent.apps.1234567890-abcdef`

`EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` must come from a Google Cloud iOS OAuth
client registered for `pl.rozliczkorki.app`. It is embedded in the app binary;
despite its `EXPO_PUBLIC_` prefix it is stored as a GitHub secret here to keep
release configuration in one place.

## Notes

- `android/` and `ios/` are generated by `expo prebuild` (Continuous Native
  Generation) and are gitignored — don't hand-edit them, they get wiped and
  regenerated on every release build.
- Both scripts default `ANDROID_HOME` to `~/Library/Android/sdk`; override it
  if your SDK lives elsewhere.
- App id: `pl.rozliczkorki.app`.
