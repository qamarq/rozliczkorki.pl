import { NextResponse } from "next/server";

const IOS_APP_IDS = ["VQV5GK6NHP.pl.rozliczkorki.app"];

export function GET() {
  return NextResponse.json({
    webcredentials: { apps: IOS_APP_IDS },
  });
}
