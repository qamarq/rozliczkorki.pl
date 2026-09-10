#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PROD_API_URL="${EXPO_PUBLIC_API_URL:-https://rozliczkorki.pl}"

# Point the build at the production API regardless of what .env has for
# local dev, then restore it afterwards no matter how the script exits.
if [ -f .env ]; then
  cp .env .env.local-backup
fi
printf "EXPO_PUBLIC_API_URL=%s\n" "$PROD_API_URL" > .env

cleanup() {
  if [ -f .env.local-backup ]; then
    mv .env.local-backup .env
  else
    rm -f .env
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
