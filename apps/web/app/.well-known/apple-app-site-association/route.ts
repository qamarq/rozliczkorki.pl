import { NextResponse } from "next/server";

const IOS_APP_IDS = ["KWQW4NSRZ4.pl.rozliczkorki.app"];

export function GET() {
  return NextResponse.json({
    webcredentials: { apps: IOS_APP_IDS },
  });
}
