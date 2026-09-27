import { calendarFeeds, lessons, schools, students, type db as Database } from "@repo/db";
import { and, eq, gte, inArray, lte } from "drizzle-orm";

type Db = typeof Database;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;
const PAST_DAYS = 90;
const FUTURE_DAYS = 730;
const FETCH_STAMP_EVERY_MS = 10 * 60 * 1000;

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://rozliczkorki.pl"
  ).replace(/\/$/, "");
}

export function newCalendarFeedToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function calendarFeedLinks(token: string) {
  const url = `${siteUrl()}/api/calendar/${token}.ics`;
  const webcalUrl = url.replace(/^https?:\/\//, "webcal://");
  return {
    url,
    webcalUrl,
    googleUrl: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`,
    outlookUrl: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(url)}&name=RozliczKorki`,
  };
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function formatUtc(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export async function renderCalendarFeed(db: Db, token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;

  const [feed] = await db
    .select()
    .from(calendarFeeds)
    .where(eq(calendarFeeds.token, token));
  if (!feed) return null;

  const now = new Date();
  if (
    !feed.lastFetchedAt ||
    now.getTime() - feed.lastFetchedAt.getTime() > FETCH_STAMP_EVERY_MS
  ) {
    await db
      .update(calendarFeeds)
      .set({ lastFetchedAt: now })
      .where(eq(calendarFeeds.id, feed.id));
  }

  const rows = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.userId, feed.userId),
        gte(lessons.startsAt, new Date(now.getTime() - PAST_DAYS * 86_400_000)),
        lte(lessons.startsAt, new Date(now.getTime() + FUTURE_DAYS * 86_400_000)),
      ),
    );

  const studentIds = [...new Set(rows.map((l) => l.studentId))];
  const studentRows = studentIds.length
    ? await db.select().from(students).where(inArray(students.id, studentIds))
    : [];
  const schoolIds = [
    ...new Set(studentRows.flatMap((s) => (s.schoolId ? [s.schoolId] : []))),
  ];
  const schoolRows = schoolIds.length
    ? await db.select().from(schools).where(inArray(schools.id, schoolIds))
    : [];
  const studentById = new Map(studentRows.map((s) => [s.id, s]));
  const schoolById = new Map(schoolRows.map((s) => [s.id, s]));
  const dashboardUrl = `${siteUrl()}/dashboard`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RozliczKorki//Kalendarz zajęć//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:RozliczKorki",
    "X-WR-CALDESC:Zajęcia z RozliczKorki",
    "X-WR-TIMEZONE:Europe/Warsaw",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const lesson of rows) {
    const student = studentById.get(lesson.studentId);
    const school = student?.schoolId ? schoolById.get(student.schoolId) : undefined;
    const cancelled = lesson.status === "cancelled";
    const name = student?.name ?? "Uczeń";
    const endsAt = new Date(lesson.startsAt.getTime() + lesson.durationMinutes * 60_000);
    const location =
      lesson.mode === "remote" ? "Online" : (school?.address ?? student?.address ?? "");
    const details = [
      school && `Szkółka: ${school.name}`,
      student?.phone && `Telefon: ${student.phone}`,
      lesson.notes,
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${lesson.id}@rozliczkorki.pl`,
      `DTSTAMP:${formatUtc(lesson.updatedAt)}`,
      `LAST-MODIFIED:${formatUtc(lesson.updatedAt)}`,
      `DTSTART:${formatUtc(lesson.startsAt)}`,
      `DTEND:${formatUtc(endsAt)}`,
      `SUMMARY:${escapeText(`${cancelled ? "Odwołane" : "Korki"}: ${name}`)}`,
      `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
      `TRANSP:${cancelled ? "TRANSPARENT" : "OPAQUE"}`,
      `URL:${dashboardUrl}`,
    );
    if (location) lines.push(`LOCATION:${escapeText(location)}`);
    if (details.length) lines.push(`DESCRIPTION:${escapeText(details.join("\n"))}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
