#!/usr/bin/env bash
set -euo pipefail
NATIVE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$NATIVE_DIR"

: "${EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME:?EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME is required}"
: "${APPLE_DEVELOPER_TEAM_ID:?APPLE_DEVELOPER_TEAM_ID is required}"
: "${MATCH_PASSWORD:?MATCH_PASSWORD is required}"
: "${APP_STORE_CONNECT_API_KEY_KEY_ID:?APP_STORE_CONNECT_API_KEY_KEY_ID is required}"
: "${APP_STORE_CONNECT_API_KEY_ISSUER_ID:?APP_STORE_CONNECT_API_KEY_ISSUER_ID is required}"
: "${APP_STORE_CONNECT_API_KEY_KEY_PATH:?APP_STORE_CONNECT_API_KEY_KEY_PATH is required}"

if [[ "$EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME" == *"REPLACE_WITH_IOS_CLIENT_ID"* ]]; then
  echo "EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME still contains the placeholder" >&2
  exit 1
fi

PROD_API_URL="${EXPO_PUBLIC_API_URL:-https://rozliczkorki.pl}"

if [ -f "$NATIVE_DIR/.env" ]; then
  cp "$NATIVE_DIR/.env" "$NATIVE_DIR/.env.local-backup"
  grep -v '^EXPO_PUBLIC_API_URL=' "$NATIVE_DIR/.env.local-backup" > "$NATIVE_DIR/.env" || true
else
  : > "$NATIVE_DIR/.env"
fi
printf "EXPO_PUBLIC_API_URL=%s\n" "$PROD_API_URL" >> "$NATIVE_DIR/.env"

cleanup() {
  if [ -f "$NATIVE_DIR/.env.local-backup" ]; then
    mv "$NATIVE_DIR/.env.local-backup" "$NATIVE_DIR/.env"
  else
    rm -f "$NATIVE_DIR/.env"
  fi
}
trap cleanup EXIT

echo "==> Regenerating ios/ (expo prebuild)"
npx expo prebuild --platform ios --no-install

echo "==> Installing CocoaPods dependencies"
pod install --project-directory=ios

echo "==> Building and uploading to TestFlight"
bundle exec fastlane ios internal
