import { renderCalendarFeed } from "@repo/api";
import { db } from "@repo/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const body = await renderCalendarFeed(db, file.replace(/\.ics$/i, ""));
  if (body === null) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="rozliczkorki.ics"',
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
