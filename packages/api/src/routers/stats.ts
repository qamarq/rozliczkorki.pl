import { lessons, students, studentRates } from "@repo/db";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { settleLessons } from "../pricing";
import { protectedProcedure, router } from "../trpc";
import { analyticsProcedure } from "./analytics";

export const statsRouter = router({
  analytics: analyticsProcedure,

  summary: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const lessonRows = await ctx.db
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.userId, ctx.session.user.id),
            gte(lessons.startsAt, new Date(input.from)),
            lte(lessons.startsAt, new Date(input.to)),
          ),
        );

      const studentIds = [...new Set(lessonRows.map((l) => l.studentId))];
      const rates = studentIds.length
        ? await ctx.db
            .select()
            .from(studentRates)
            .where(inArray(studentRates.studentId, studentIds))
        : [];
      const studentRows = studentIds.length
        ? await ctx.db.select().from(students).where(inArray(students.id, studentIds))
        : [];
      const history = studentIds.length
        ? await ctx.db
            .select()
            .from(lessons)
            .where(
              and(
                eq(lessons.userId, ctx.session.user.id),
                inArray(lessons.studentId, studentIds),
              ),
            )
        : [];
      const settlements = settleLessons(history, rates);
      const studentById = new Map(studentRows.map((s) => [s.id, s]));

      let theoretical = 0;
      let paid = 0;
      let unpaid = 0;
      let awaitingPayout = 0;
      let completedCount = 0;
      let scheduledCount = 0;
      let cancelledCount = 0;
      const byStudent = new Map<
        string,
        {
          studentId: string;
          name: string;
          theoretical: number;
          paid: number;
          unpaid: number;
        }
      >();

      for (const lesson of lessonRows) {
        if (lesson.status === "cancelled") {
          cancelledCount += 1;
          continue;
        }
        if (lesson.status === "completed") completedCount += 1;
        else scheduledCount += 1;

        const settlement = settlements.get(lesson.id);
        if (!settlement) continue;

        const student = studentById.get(lesson.studentId);

        theoretical += settlement.price;
        paid += settlement.received;
        if (student?.schoolId) awaitingPayout += settlement.outstanding;
        else unpaid += settlement.outstanding;

        const entry = byStudent.get(lesson.studentId) ?? {
          studentId: lesson.studentId,
          name: student?.name ?? "?",
          theoretical: 0,
          paid: 0,
          unpaid: 0,
        };
        entry.theoretical += settlement.price;
        entry.paid += settlement.received;
        entry.unpaid += settlement.outstanding;
        byStudent.set(lesson.studentId, entry);
      }

      return {
        theoretical,
        paid,
        unpaid,
        awaitingPayout,
        completedCount,
        scheduledCount,
        cancelledCount,
        byStudent: [...byStudent.values()].sort((a, b) => b.theoretical - a.theoretical),
      };
    }),
});
