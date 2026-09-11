import { NextResponse } from "next/server";

// Play App Signing key (classical) — what every install from Play is signed with.
const ANDROID_SHA256_FINGERPRINTS = [
  "E8:31:FC:11:6E:2B:69:BB:B9:C8:07:DD:53:C0:37:C2:DD:44:85:F6:4F:00:DE:02:29:79:82:5D:D7:4C:7F:78",
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
