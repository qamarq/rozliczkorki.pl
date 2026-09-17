import { lessons, recurringRules, students } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const WEEKS_TO_GENERATE = 8;
// Safety cap for open-ended rules (no endDate) so a bad input can't spin forever.
const MAX_OCCURRENCES = 400;

function nextOccurrences(
  rule: {
    dayOfWeek: number;
    startTime: string;
    startDate: string;
    endDate: string | null;
  },
  after: Date,
  fallbackCount: number,
): Date[] {
  const [hours, minutes] = rule.startTime.split(":").map(Number);
  const results: Date[] = [];
  const cursor = new Date(after);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  const end = rule.endDate ? new Date(rule.endDate) : null;
  // With an end date, generate every occurrence up to it (bounded by the
  // date itself). Without one, fall back to a fixed rolling window.
  const limit = end ? MAX_OCCURRENCES : fallbackCount;

  while (results.length < limit) {
    if (cursor.getDay() === rule.dayOfWeek) {
      const occurrence = new Date(cursor);
      occurrence.setHours(hours, minutes, 0, 0);
      if (occurrence >= new Date(rule.startDate) && (!end || occurrence <= end)) {
        results.push(occurrence);
      } else if (end && occurrence > end) {
        break;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

function timeZoneOffsetMinutes(timeZone: string, date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

// Moves a date by whole weeks while keeping its wall-clock time in the given zone across DST changes.
function addWeeksInTimeZone(date: Date, weeks: number, timeZone: string) {
  const shifted = new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  const drift =
    timeZoneOffsetMinutes(timeZone, date) - timeZoneOffsetMinutes(timeZone, shifted);
  return new Date(shifted.getTime() + drift * 60_000);
}

const endDateChangeInput = z.object({
  id: z.string().uuid(),
  // End of the chosen day in the user's time zone.
  until: z.string().datetime(),
  timeZone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }),
});

async function planEndDateChange(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  input: z.infer<typeof endDateChangeInput>,
) {
  const [rule] = await db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.id, input.id), eq(recurringRules.userId, userId)));
  if (!rule) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const until = new Date(input.until);
  const ruleLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.recurringRuleId, rule.id), eq(lessons.userId, userId)))
    .orderBy(asc(lessons.startsAt));

  const afterEnd = ruleLessons.filter((l) => l.startsAt > until);
  const toRemove = afterEnd.filter((l) => !l.paid).map((l) => l.id);
  const keptPaid = afterEnd.length - toRemove.length;
  const template = ruleLessons.filter((l) => !toRemove.includes(l.id)).at(-1);

  const occurrences: Date[] = [];
  if (template) {
    let week = 1;
    let next = addWeeksInTimeZone(template.startsAt, week, input.timeZone);
    while (next <= until && occurrences.length < MAX_OCCURRENCES) {
      occurrences.push(next);
      week += 1;
      next = addWeeksInTimeZone(template.startsAt, week, input.timeZone);
    }
  }

  return { rule, toRemove, keptPaid, template, occurrences };
}

export const recurringRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.userId, ctx.session.user.id));
  }),

  create: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        durationMinutes: z.number().int().positive(),
        startDate: z.string(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [student] = await ctx.db
        .select()
        .from(students)
        .where(
          and(eq(students.id, input.studentId), eq(students.userId, ctx.session.user.id)),
        );
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
      }

      const [rule] = await ctx.db
        .insert(recurringRules)
        .values({
          userId: ctx.session.user.id,
          studentId: input.studentId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          durationMinutes: input.durationMinutes,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
        })
        .returning();

      if (!rule) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const occurrences = nextOccurrences(
        rule,
        new Date(new Date(input.startDate).getTime() - 24 * 60 * 60 * 1000),
        WEEKS_TO_GENERATE,
      );

      if (occurrences.length > 0) {
        await ctx.db.insert(lessons).values(
          occurrences.map((startsAt) => ({
            userId: ctx.session.user.id,
            studentId: input.studentId,
            recurringRuleId: rule.id,
            startsAt,
            durationMinutes: input.durationMinutes,
          })),
        );
      }

      return rule;
    }),

  extend: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        weeks: z.number().int().positive().default(WEEKS_TO_GENERATE),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [rule] = await ctx.db
        .select()
        .from(recurringRules)
        .where(
          and(
            eq(recurringRules.id, input.id),
            eq(recurringRules.userId, ctx.session.user.id),
          ),
        );
      if (!rule) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [latest] = await ctx.db
        .select({ latest: max(lessons.startsAt) })
        .from(lessons)
        .where(eq(lessons.recurringRuleId, rule.id));

      const after = latest?.latest ?? new Date(rule.startDate);
      const occurrences = nextOccurrences(rule, after, input.weeks);

      if (occurrences.length > 0) {
        await ctx.db.insert(lessons).values(
          occurrences.map((startsAt) => ({
            userId: ctx.session.user.id,
            studentId: rule.studentId,
            recurringRuleId: rule.id,
            startsAt,
            durationMinutes: rule.durationMinutes,
          })),
        );
      }

      return { created: occurrences.length };
    }),

  lastLesson: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [latest] = await ctx.db
        .select({ startsAt: max(lessons.startsAt) })
        .from(lessons)
        .where(
          and(
            eq(lessons.recurringRuleId, input.id),
            eq(lessons.userId, ctx.session.user.id),
          ),
        );
      return { startsAt: latest?.startsAt ?? null };
    }),

  previewEndDate: protectedProcedure
    .input(endDateChangeInput)
    .query(async ({ ctx, input }) => {
      const plan = await planEndDateChange(ctx.db, ctx.session.user.id, input);
      return {
        added: plan.occurrences.length,
        removed: plan.toRemove.length,
        keptPaid: plan.keptPaid,
      };
    }),

  setEndDate: protectedProcedure
    .input(
      endDateChangeInput.extend({ endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { rule, toRemove, occurrences, template } = await planEndDateChange(
        ctx.db,
        userId,
        input,
      );

      if (toRemove.length > 0) {
        await ctx.db.delete(lessons).where(inArray(lessons.id, toRemove));
      }

      if (template && occurrences.length > 0) {
        await ctx.db.insert(lessons).values(
          occurrences.map((startsAt) => ({
            userId,
            studentId: rule.studentId,
            recurringRuleId: rule.id,
            startsAt,
            durationMinutes: template.durationMinutes,
            prorate: template.prorate,
          })),
        );
      }

      await ctx.db
        .update(recurringRules)
        .set({ endDate: input.endDate })
        .where(eq(recurringRules.id, rule.id));

      return { created: occurrences.length, removed: toRemove.length };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(recurringRules)
        .set({ active: false })
        .where(
          and(
            eq(recurringRules.id, input.id),
            eq(recurringRules.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),
});
