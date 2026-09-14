import { NextResponse } from "next/server";

// Play App Signing key (classical) — what every install from Play is signed with.
const ANDROID_SHA256_FINGERPRINTS = [
  "E8:31:FC:11:6E:2B:69:BB:B9:C8:07:DD:53:C0:37:C2:DD:44:85:F6:4F:00:DE:02:29:79:82:5D:D7:4C:7F:78",
  "DB:D5:9B:B1:39:3E:C1:FE:F2:4C:14:BC:4D:15:E0:E2:D5:5F:63:74:27:A6:77:87:FE:4D:3C:E8:1D:8C:2C:50",
  "7A:DE:F2:B7:BC:9D:98:5B:4C:AD:D8:9C:65:53:A4:25:A1:BC:EA:A7:BF:B6:7F:1D:BD:13:41:07:92:7C:73:F9",
  "D3:B4:57:DB:4B:B4:99:A3:54:7E:6F:78:C9:5A:CA:C1:79:96:9B:1C:7F:A8:CD:BE:6A:81:55:43:56:05:3B:5F",
];

export function GET() {
  return NextResponse.json([
    {
      relation: ["delegate_permission/common.get_login_creds"],
      target: {
        namespace: "web",
        site: "https://rozliczkorki.pl",
      },
    },
    {
      relation: [
        "delegate_permission/common.get_login_creds",
        "delegate_permission/common.handle_all_urls",
      ],
      target: {
        namespace: "android_app",
        package_name: "pl.rozliczkorki.app",
        sha256_cert_fingerprints: ANDROID_SHA256_FINGERPRINTS,
      },
    },
  ]);
}
