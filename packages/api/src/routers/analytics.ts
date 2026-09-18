import {
  lessons,
  recurringRules,
  schools,
  students,
  studentRates,
  vacations,
  type lessonModeEnum,
} from "@repo/db";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { lessonPrice, settleLessons } from "../pricing";
import { protectedProcedure } from "../trpc";

type Lesson = typeof lessons.$inferSelect;
type Mode = (typeof lessonModeEnum.enumValues)[number];

export const analyticsInput = z.object({
  buckets: z
    .array(
      z.object({ key: z.string(), label: z.string(), from: z.string(), to: z.string() }),
    )
    .min(1)
    .max(200),
  compare: z.object({ from: z.string(), to: z.string() }).nullable(),
  now: z.string(),
});

const round = (n: number) => Math.round(n * 100) / 100;

function localDate(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyBucket(key: string, label: string, isPast: boolean) {
  return {
    key,
    label,
    isPast,
    revenue: 0,
    paid: 0,
    unpaid: 0,
    lessons: 0,
    hours: 0,
  };
}

type Bucket = ReturnType<typeof emptyBucket>;

export const analyticsProcedure = protectedProcedure
  .input(analyticsInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const now = new Date(input.now);

    const [lessonRows, studentRows, ruleRows, vacationRows, schoolRows] =
      await Promise.all([
        ctx.db.select().from(lessons).where(eq(lessons.userId, userId)),
        ctx.db.select().from(students).where(eq(students.userId, userId)),
        ctx.db.select().from(recurringRules).where(eq(recurringRules.userId, userId)),
        ctx.db.select().from(vacations).where(eq(vacations.userId, userId)),
        ctx.db.select().from(schools).where(eq(schools.userId, userId)),
      ]);

    const studentIds = studentRows.map((s) => s.id);
    const rates = studentIds.length
      ? await ctx.db
          .select()
          .from(studentRates)
          .where(inArray(studentRates.studentId, studentIds))
      : [];

    const settlements = settleLessons(lessonRows, rates);
    const studentById = new Map(studentRows.map((s) => [s.id, s]));
    const schoolById = new Map(schoolRows.map((s) => [s.id, s]));
    const ratesByStudent = new Map<string, typeof rates>();
    for (const rate of rates) {
      const list = ratesByStudent.get(rate.studentId) ?? [];
      list.push(rate);
      ratesByStudent.set(rate.studentId, list);
    }

    const takenSlots = new Set(
      lessonRows.map((l) => `${l.studentId}|${localDate(l.startsAt)}`),
    );
    const vacationDays = new Set<string>();
    for (const vacation of vacationRows) {
      const cursor = new Date(`${vacation.startDate}T12:00:00`);
      const end = new Date(`${vacation.endDate}T12:00:00`);
      while (cursor <= end) {
        vacationDays.add(localDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const ranges = input.buckets.map((b) => ({
      key: b.key,
      from: new Date(b.from),
      to: new Date(b.to),
    }));
    const buckets = new Map<string, Bucket>();
    for (const [i, range] of ranges.entries()) {
      const source = input.buckets[i]!;
      buckets.set(range.key, emptyBucket(source.key, source.label, range.to <= now));
    }
    const bucketOf = (date: Date) =>
      buckets.get(ranges.find((r) => date >= r.from && date <= r.to)?.key ?? "");

    const rangeFrom = ranges[0]!.from;
    const rangeTo = ranges.at(-1)!.to;
    const inRange = (date: Date) => date >= rangeFrom && date <= rangeTo;

    const compareFrom = input.compare ? new Date(input.compare.from) : null;
    const compareTo = input.compare ? new Date(input.compare.to) : null;

    const totals = {
      expected: 0,
      billed: 0,
      paid: 0,
      unpaid: 0,
      planned: 0,
      projected: 0,
      awaitingPayout: 0,
      unpaidLessons: 0,
      awaitingPayoutLessons: 0,
      lessonCount: 0,
      projectedLessons: 0,
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      cancelledByVacation: 0,
      hours: 0,
    };
    const compare = { billed: 0, paid: 0, lessonCount: 0, hours: 0 };

    const byStudent = new Map<
      string,
      {
        studentId: string;
        name: string;
        type: "private" | "school";
        lessonCount: number;
        hours: number;
        billed: number;
        paid: number;
        unpaid: number;
      }
    >();
    const modeSplit: Record<Mode, number> = { in_person: 0, remote: 0 };
    const paymentSplit = { cash: 0, transfer: 0, unknown: 0 };
    const typeSplit = { private: 0, school: 0 };

    let outstandingTotal = 0;
    const outstandingByStudent = new Map<string, number>();
    let awaitingTotal = 0;
    const awaitingBySchool = new Map<string, number>();

    const addStudent = (lesson: Lesson, price: number, received: number, due: number) => {
      const student = studentById.get(lesson.studentId);
      const entry = byStudent.get(lesson.studentId) ?? {
        studentId: lesson.studentId,
        name: student?.name ?? "?",
        type: student?.schoolId ? ("school" as const) : ("private" as const),
        lessonCount: 0,
        hours: 0,
        billed: 0,
        paid: 0,
        unpaid: 0,
      };
      entry.lessonCount += 1;
      entry.hours += lesson.durationMinutes / 60;
      entry.billed += price;
      entry.paid += received;
      entry.unpaid += due;
      byStudent.set(lesson.studentId, entry);

      modeSplit[lesson.mode] += 1;
      typeSplit[student?.schoolId ? "school" : "private"] += price;
      if (received > 0) paymentSplit[lesson.paymentMethod ?? "unknown"] += received;
    };

    for (const lesson of lessonRows) {
      const settlement = settlements.get(lesson.id);
      const price = settlement?.price ?? 0;
      const received = settlement?.received ?? 0;
      const due = settlement?.outstanding ?? 0;
      const past = lesson.startsAt <= now;

      const schoolId = studentById.get(lesson.studentId)?.schoolId ?? null;

      if (past && lesson.status !== "cancelled" && due > 0) {
        if (schoolId) {
          awaitingTotal += due;
          awaitingBySchool.set(schoolId, (awaitingBySchool.get(schoolId) ?? 0) + due);
        } else {
          outstandingTotal += due;
          outstandingByStudent.set(
            lesson.studentId,
            (outstandingByStudent.get(lesson.studentId) ?? 0) + due,
          );
        }
      }

      if (
        compareFrom &&
        compareTo &&
        lesson.startsAt >= compareFrom &&
        lesson.startsAt <= compareTo
      ) {
        if (lesson.status !== "cancelled") {
          compare.billed += price;
          compare.paid += received;
          compare.lessonCount += 1;
          compare.hours += lesson.durationMinutes / 60;
        }
      }

      if (!inRange(lesson.startsAt)) continue;

      if (lesson.status === "cancelled") {
        totals.cancelled += 1;
        if (lesson.vacationId) totals.cancelledByVacation += 1;
        continue;
      }

      const bucket = bucketOf(lesson.startsAt);
      if (bucket) {
        bucket.revenue += price;
        bucket.paid += received;
        bucket.unpaid += due;
        bucket.lessons += 1;
        bucket.hours += lesson.durationMinutes / 60;
      }

      totals.billed += price;
      totals.expected += price;
      totals.paid += received;
      totals.lessonCount += 1;
      totals.hours += lesson.durationMinutes / 60;
      if (lesson.status === "completed") totals.completed += 1;
      else totals.scheduled += 1;
      if (!past) totals.planned += due;
      else if (schoolId) {
        totals.awaitingPayout += due;
        if (due > 0) totals.awaitingPayoutLessons += 1;
      } else {
        totals.unpaid += due;
        if (due > 0) totals.unpaidLessons += 1;
      }

      addStudent(lesson, price, received, due);
    }

    const projectionStart = now > rangeFrom ? now : rangeFrom;

    for (const rule of ruleRows) {
      if (!rule.active) continue;
      const ruleRates = ratesByStudent.get(rule.studentId) ?? [];
      const ruleEnd = rule.endDate ? new Date(`${rule.endDate}T23:59:59`) : null;
      const [hours, minutes] = rule.startTime.split(":").map(Number);
      const cursor = new Date(projectionStart);
      cursor.setHours(0, 0, 0, 0);
      while (cursor.getDay() !== rule.dayOfWeek) cursor.setDate(cursor.getDate() + 1);

      while (cursor <= rangeTo) {
        const occurrence = new Date(cursor);
        occurrence.setHours(hours ?? 0, minutes ?? 0, 0, 0);
        if (ruleEnd && occurrence > ruleEnd) break;

        const day = localDate(occurrence);
        const skip =
          occurrence < new Date(`${rule.startDate}T00:00:00`) ||
          occurrence < projectionStart ||
          vacationDays.has(day) ||
          takenSlots.has(`${rule.studentId}|${day}`);

        if (!skip) {
          const price = round(
            lessonPrice(
              {
                startsAt: occurrence,
                durationMinutes: rule.durationMinutes,
                priceOverride: null,
                prorate: false,
              },
              ruleRates,
            ),
          );
          const bucket = bucketOf(occurrence);
          if (bucket) {
            bucket.revenue += price;
            bucket.lessons += 1;
            bucket.hours += rule.durationMinutes / 60;
          }
          totals.expected += price;
          totals.projected += price;
          totals.projectedLessons += 1;
        }
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    const series = [...buckets.values()].map((b) => ({
      ...b,
      revenue: round(b.revenue),
      paid: round(b.paid),
      unpaid: round(b.unpaid),
      hours: round(b.hours),
    }));

    const students_ = [...byStudent.values()]
      .map((s) => ({
        ...s,
        hours: round(s.hours),
        billed: round(s.billed),
        paid: round(s.paid),
        unpaid: round(s.unpaid),
      }))
      .sort((a, b) => b.billed - a.billed);

    const totalHours = round(totals.hours);

    return {
      series,
      totals: {
        ...totals,
        expected: round(totals.expected),
        billed: round(totals.billed),
        paid: round(totals.paid),
        unpaid: round(totals.unpaid),
        awaitingPayout: round(totals.awaitingPayout),
        planned: round(totals.planned),
        projected: round(totals.projected),
        hours: totalHours,
        effectiveHourlyRate: totalHours > 0 ? round(totals.billed / totalHours) : 0,
        collectionRate:
          totals.billed > 0 ? Math.round((totals.paid / totals.billed) * 100) : 0,
        cancellationRate:
          totals.lessonCount + totals.cancelled > 0
            ? Math.round(
                (totals.cancelled / (totals.lessonCount + totals.cancelled)) * 100,
              )
            : 0,
        activeStudents: students_.length,
      },
      compare: input.compare
        ? {
            billed: round(compare.billed),
            paid: round(compare.paid),
            lessonCount: compare.lessonCount,
            hours: round(compare.hours),
            effectiveHourlyRate:
              compare.hours > 0 ? round(compare.billed / compare.hours) : 0,
          }
        : null,
      byStudent: students_,
      splits: {
        mode: modeSplit,
        type: { private: round(typeSplit.private), school: round(typeSplit.school) },
        payment: {
          cash: round(paymentSplit.cash),
          transfer: round(paymentSplit.transfer),
          unknown: round(paymentSplit.unknown),
        },
      },
      payouts: {
        awaiting: round(awaitingTotal),
        schools: [...awaitingBySchool.entries()]
          .map(([schoolId, amount]) => ({
            schoolId,
            name: schoolById.get(schoolId)?.name ?? "?",
            amount: round(amount),
          }))
          .sort((a, b) => b.amount - a.amount),
      },
      debt: {
        outstanding: round(outstandingTotal),
        debtors: [...outstandingByStudent.entries()]
          .map(([studentId, amount]) => ({
            studentId,
            name: studentById.get(studentId)?.name ?? "?",
            amount: round(amount),
          }))
          .sort((a, b) => b.amount - a.amount),
      },
    };
  });
