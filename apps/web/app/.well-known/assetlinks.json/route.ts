import { NextResponse } from "next/server";

// Fill in the SHA-256 signing certificate fingerprint(s) for the Android app.
// Get it from Google Play Console > Setup > App integrity > App signing key
// certificate, or via `eas credentials` if using EAS Build.
const ANDROID_SHA256_FINGERPRINTS = ["REPLACE_WITH_SHA256_FINGERPRINT"];

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
