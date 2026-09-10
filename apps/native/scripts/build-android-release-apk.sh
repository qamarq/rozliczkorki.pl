#!/usr/bin/env bash
set -euo pipefail
NATIVE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$NATIVE_DIR"

PROD_API_URL="${EXPO_PUBLIC_API_URL:-https://rozliczkorki.pl}"

if [ -f "$NATIVE_DIR/.env" ]; then
  cp "$NATIVE_DIR/.env" "$NATIVE_DIR/.env.local-backup"
fi
printf "EXPO_PUBLIC_API_URL=%s\n" "$PROD_API_URL" > "$NATIVE_DIR/.env"

cleanup() {
  if [ -f "$NATIVE_DIR/.env.local-backup" ]; then
    mv "$NATIVE_DIR/.env.local-backup" "$NATIVE_DIR/.env"
  else
    rm -f "$NATIVE_DIR/.env"
  fi
}
trap cleanup EXIT

echo "==> Regenerating android/ (expo prebuild)"
npx expo prebuild --platform android --no-install

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

if [ ! -f "$ANDROID_HOME/../local.properties" ]; then :; fi
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "==> Building release APK (this takes a few minutes)"
cd android
./gradlew assembleRelease --no-daemon

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "✔ Build finished: apps/native/${APK_PATH#./}"
