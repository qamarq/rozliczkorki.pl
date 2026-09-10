import { NextResponse } from "next/server";

// Fill in your Apple Developer Team ID (Apple Developer > Membership).
// Format: "<TEAM_ID>.pl.rozliczkorki.app"
const APPLE_APP_ID = "REPLACE_WITH_APPLE_TEAM_ID.pl.rozliczkorki.app";

export function GET() {
  return NextResponse.json({
    webcredentials: {
      apps: [APPLE_APP_ID],
    },
  });
}
