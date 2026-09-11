#!/usr/bin/env bash
set -euo pipefail
NATIVE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$NATIVE_DIR"

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

echo "==> Building release AAB (this takes a few minutes)"
cd android
./gradlew bundleRelease --no-daemon

AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "✔ Build finished: apps/native/${AAB_PATH#./}"
