import { lessons, recurringRules, students } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, eq, max } from "drizzle-orm";
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
