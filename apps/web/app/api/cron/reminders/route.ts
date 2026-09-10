import { db, lessons, pushTokens, students } from "@repo/db";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

async function sendExpoPush(messages: { to: string; title: string; body: string }[]) {
  if (messages.length === 0) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(messages),
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const upcoming = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, startOfDay(tomorrow)),
        lte(lessons.startsAt, endOfDay(tomorrow)),
      ),
    );

  const userIds = [...new Set(upcoming.map((l) => l.userId))];
  const studentIds = [...new Set(upcoming.map((l) => l.studentId))];

  const tokens = userIds.length
    ? await db.select().from(pushTokens).where(inArray(pushTokens.userId, userIds))
    : [];
  const studentRows = studentIds.length
    ? await db.select().from(students).where(inArray(students.id, studentIds))
    : [];
  const studentById = new Map(studentRows.map((s) => [s.id, s]));

  const messages = upcoming.flatMap((lesson) => {
    const student = studentById.get(lesson.studentId);
    const userTokens = tokens.filter((t) => t.userId === lesson.userId);
    return userTokens.map((t) => ({
      to: t.token,
      title: "Jutro masz zajęcia",
      body: `${student?.name ?? "Uczeń"} o ${lesson.startsAt.toISOString().slice(11, 16)}`,
    }));
  });

  await sendExpoPush(messages);

  return NextResponse.json({ sent: messages.length });
}
