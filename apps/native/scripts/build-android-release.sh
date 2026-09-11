#!/usr/bin/env bash
set -euo pipefail
NATIVE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$NATIVE_DIR"

# Usage: build-android-release.sh [aab|apk] [--install]
FORMAT="aab"
INSTALL="0"
for arg in "$@"; do
  case "$arg" in
    aab|apk) FORMAT="$arg" ;;
    --install) INSTALL="1" ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

PROD_API_URL="${EXPO_PUBLIC_API_URL:-https://rozliczkorki.pl}"

# Point the build at the production API regardless of what .env has for
# local dev, then restore it afterwards no matter how the script exits.
# Uses absolute paths since the script cd's into android/ later on, and
# a trap's cleanup runs in whatever directory the script happens to exit from.
if [ -f "$NATIVE_DIR/.env" ]; then
  cp "$NATIVE_DIR/.env" "$NATIVE_DIR/.env.local-backup"
  # Keep every other var from .env (e.g. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) —
  # only EXPO_PUBLIC_API_URL gets overridden for this build.
  grep -v '^EXPO_PUBLIC_API_URL=' "$NATIVE_DIR/.env.local-backup" > "$NATIVE_DIR/.env" || true
  printf "EXPO_PUBLIC_API_URL=%s\n" "$PROD_API_URL" >> "$NATIVE_DIR/.env"
else
  printf "EXPO_PUBLIC_API_URL=%s\n" "$PROD_API_URL" > "$NATIVE_DIR/.env"
fi

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

if [ "$FORMAT" = "apk" ]; then
  echo "==> Building release APK (this takes a few minutes)"
  cd android
  ./gradlew assembleRelease --no-daemon
  cd "$NATIVE_DIR"
  OUT_PATH="android/app/build/outputs/apk/release/app-release.apk"
else
  echo "==> Building release AAB (this takes a few minutes)"
  cd android
  ./gradlew bundleRelease --no-daemon
  cd "$NATIVE_DIR"
  OUT_PATH="android/app/build/outputs/bundle/release/app-release.aab"
fi

echo ""
echo "✔ Build finished: apps/native/${OUT_PATH#./}"

if [ "$INSTALL" = "1" ]; then
  if [ "$FORMAT" != "apk" ]; then
    echo "adb install needs an APK — rerun with: $0 apk --install" >&2
    exit 1
  fi
  echo "==> Installing on the connected device"
  adb install -r "$NATIVE_DIR/$OUT_PATH"
fi
