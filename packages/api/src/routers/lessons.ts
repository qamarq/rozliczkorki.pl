import { lessons, students, studentRates } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { lessonPrice } from "../pricing";
import { protectedProcedure, router } from "../trpc";

async function assertOwnsLesson(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  lessonId: string,
) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)));
  if (!lesson) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono zajęć" });
  }
  return lesson;
}

async function withPrices(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  rows: (typeof lessons.$inferSelect)[],
) {
  const studentIds = [...new Set(rows.map((l) => l.studentId))];
  if (studentIds.length === 0) return rows.map((l) => ({ ...l, price: 0 }));

  const rates = await db
    .select()
    .from(studentRates)
    .where(inArray(studentRates.studentId, studentIds));

  return rows.map((lesson) => ({
    ...lesson,
    price: lessonPrice(
      lesson,
      rates.filter((r) => r.studentId === lesson.studentId),
    ),
  }));
}

export const lessonsRouter = router({
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const lesson = await assertOwnsLesson(ctx.db, ctx.session.user.id, input.id);
      const [student] = await ctx.db
        .select()
        .from(students)
        .where(eq(students.id, lesson.studentId));
      const [priced] = await withPrices(ctx.db, ctx.session.user.id, [lesson]);
      return { ...priced, student };
    }),

  range: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.userId, ctx.session.user.id),
            gte(lessons.startsAt, new Date(input.from)),
            lte(lessons.startsAt, new Date(input.to)),
          ),
        );
      const withStudents = await ctx.db
        .select()
        .from(students)
        .where(eq(students.userId, ctx.session.user.id));
      const studentById = new Map(withStudents.map((s) => [s.id, s]));

      const priced = await withPrices(ctx.db, ctx.session.user.id, rows);
      return priced
        .map((lesson) => ({ ...lesson, student: studentById.get(lesson.studentId) }))
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    }),

  create: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        startsAt: z.string(),
        durationMinutes: z.number().int().positive(),
        prorate: z.boolean().default(false),
        status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
        paid: z.boolean().default(false),
        paymentMethod: z.enum(["cash", "transfer"]).nullable().optional(),
        priceOverride: z.coerce.number().positive().nullable().optional(),
        notes: z.string().optional(),
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

      const [lesson] = await ctx.db
        .insert(lessons)
        .values({
          userId: ctx.session.user.id,
          studentId: input.studentId,
          startsAt: new Date(input.startsAt),
          durationMinutes: input.durationMinutes,
          prorate: input.prorate,
          status: input.status,
          paid: input.paid,
          paymentMethod: input.paymentMethod ?? null,
          priceOverride: input.priceOverride?.toString() ?? null,
          notes: input.notes,
        })
        .returning();
      return lesson;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        startsAt: z.string().optional(),
        durationMinutes: z.number().int().positive().optional(),
        prorate: z.boolean().optional(),
        status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
        paid: z.boolean().optional(),
        paymentMethod: z.enum(["cash", "transfer"]).nullable().optional(),
        priceOverride: z.coerce.number().positive().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsLesson(ctx.db, ctx.session.user.id, input.id);
      const { id, startsAt, priceOverride, ...rest } = input;
      const [updated] = await ctx.db
        .update(lessons)
        .set({
          ...rest,
          ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
          ...(priceOverride !== undefined
            ? { priceOverride: priceOverride?.toString() ?? null }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(lessons.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnsLesson(ctx.db, ctx.session.user.id, input.id);
      await ctx.db.delete(lessons).where(eq(lessons.id, input.id));
      return { success: true };
    }),
});
