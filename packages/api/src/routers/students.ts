import { students, studentRates } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

async function assertOwnsStudent(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  studentId: string,
) {
  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.userId, userId)));
  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono ucznia" });
  }
  return student;
}

export const studentsRouter = router({
  list: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(students.userId, ctx.session.user.id)];
      if (!input?.includeArchived) {
        conditions.push(eq(students.archived, false));
      }
      return ctx.db
        .select()
        .from(students)
        .where(and(...conditions))
        .orderBy(asc(students.name));
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const student = await assertOwnsStudent(ctx.db, ctx.session.user.id, input.id);
      const rates = await ctx.db
        .select()
        .from(studentRates)
        .where(eq(studentRates.studentId, input.id))
        .orderBy(desc(studentRates.effectiveFrom));
      return { ...student, rates };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        type: z.enum(["private", "school"]).default("private"),
        defaultMode: z.enum(["in_person", "remote"]).default("in_person"),
        hourlyRate: z.coerce.number().positive(),
        currency: z.string().default("PLN"),
        effectiveFrom: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [student] = await ctx.db
        .insert(students)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          address: input.address,
          phone: input.phone,
          type: input.type,
          defaultMode: input.defaultMode,
        })
        .returning();

      if (!student) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      await ctx.db.insert(studentRates).values({
        studentId: student.id,
        hourlyRate: input.hourlyRate.toString(),
        currency: input.currency,
        effectiveFrom: input.effectiveFrom,
      });

      return student;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        address: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        type: z.enum(["private", "school"]).optional(),
        defaultMode: z.enum(["in_person", "remote"]).optional(),
        archived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsStudent(ctx.db, ctx.session.user.id, input.id);
      const { id, ...rest } = input;
      const [updated] = await ctx.db
        .update(students)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(students.id, id))
        .returning();
      return updated;
    }),

  addRate: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        hourlyRate: z.coerce.number().positive(),
        currency: z.string().default("PLN"),
        effectiveFrom: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsStudent(ctx.db, ctx.session.user.id, input.studentId);
      const [rate] = await ctx.db
        .insert(studentRates)
        .values({
          studentId: input.studentId,
          hourlyRate: input.hourlyRate.toString(),
          currency: input.currency,
          effectiveFrom: input.effectiveFrom,
        })
        .returning();
      return rate;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnsStudent(ctx.db, ctx.session.user.id, input.id);
      await ctx.db.delete(students).where(eq(students.id, input.id));
      return { success: true };
    }),
});
