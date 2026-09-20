import { NextResponse } from "next/server";

const IOS_APP_IDS = ["KWQW4NSRZ4.pl.rozliczkorki.app"];

export function GET() {
  return NextResponse.json({
    applinks: {
      details: IOS_APP_IDS.map((appID) => ({
        appID,
        paths: ["/dashboard", "/dashboard/*", "/lesson/*"],
      })),
    },
    webcredentials: { apps: IOS_APP_IDS },
  });
}
