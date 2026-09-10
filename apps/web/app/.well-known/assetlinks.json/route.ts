import { NextResponse } from "next/server";

// Upload-key fingerprint (apps/native/android/app/release.keystore, alias
// "rozliczkorki"). Once the app is first uploaded to Play Console, Google
// re-signs it with its own key for distribution (Play App Signing) — swap
// this for the "App signing key certificate" SHA-256 from Play Console >
// Setup > App integrity, or credential sharing won't work for real users.
const ANDROID_SHA256_FINGERPRINTS = [
  "D3:B4:57:DB:4B:B4:99:A3:54:7E:6F:78:C9:5A:CA:C1:79:96:9B:1C:7F:A8:CD:BE:6A:81:55:43:56:05:3B:5F",
];

export function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.get_login_creds"],
      target: {
        namespace: "android_app",
        package_name: "pl.rozliczkorki.app",
        sha256_cert_fingerprints: ANDROID_SHA256_FINGERPRINTS,
      },
    },
  ]);
}
