import { lessons, schoolPayouts, schools, students, studentRates } from "@repo/db";
import {
  payoutDueDate,
  payoutPeriodOf,
  payoutStatus,
  type PayoutFrequency,
} from "@repo/shared";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { settleLessons } from "../pricing";
import { protectedProcedure, router } from "../trpc";

type School = typeof schools.$inferSelect;

async function assertOwnsSchool(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  schoolId: string,
) {
  const [school] = await db
    .select()
    .from(schools)
    .where(and(eq(schools.id, schoolId), eq(schools.userId, userId)));
  if (!school) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono szkółki" });
  }
  return school;
}

async function schoolLessons(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  schoolId: string,
) {
  const studentRows = await db
    .select()
    .from(students)
    .where(and(eq(students.userId, userId), eq(students.schoolId, schoolId)));
  const studentIds = studentRows.map((s) => s.id);
  if (studentIds.length === 0) {
    return { studentRows, lessonRows: [], rates: [] };
  }
  const [lessonRows, rates] = await Promise.all([
    db
      .select()
      .from(lessons)
      .where(and(eq(lessons.userId, userId), inArray(lessons.studentId, studentIds))),
    db.select().from(studentRates).where(inArray(studentRates.studentId, studentIds)),
  ]);
  return { studentRows, lessonRows, rates };
}

function buildPeriods(
  school: School,
  lessonRows: (typeof lessons.$inferSelect)[],
  rates: (typeof studentRates.$inferSelect)[],
  payouts: (typeof schoolPayouts.$inferSelect)[],
  now: Date,
) {
  const settlements = settleLessons(lessonRows, rates);
  const payoutByKey = new Map(payouts.map((p) => [p.periodKey, p]));
  const frequency = school.payoutFrequency as PayoutFrequency;

  const grouped = new Map<
    string,
    {
      key: string;
      label: string;
      start: string;
      end: string;
      lessonIds: string[];
      lessonCount: number;
      amount: number;
    }
  >();

  for (const lesson of lessonRows) {
    if (lesson.status === "cancelled") continue;
    const period = payoutPeriodOf(lesson.startsAt, frequency, school.payoutAnchor);
    const entry = grouped.get(period.key) ?? {
      ...period,
      lessonIds: [],
      lessonCount: 0,
      amount: 0,
    };
    entry.lessonIds.push(lesson.id);
    entry.lessonCount += 1;
    entry.amount += settlements.get(lesson.id)?.price ?? 0;
    grouped.set(period.key, entry);
  }

  for (const payout of payouts) {
    if (grouped.has(payout.periodKey)) continue;
    const period = payoutPeriodOf(
      new Date(`${payout.periodStart}T12:00:00`),
      frequency,
      school.payoutAnchor,
    );
    grouped.set(payout.periodKey, {
      ...period,
      lessonIds: [],
      lessonCount: 0,
      amount: Number(payout.amount),
    });
  }

  return [...grouped.values()]
    .map((entry) => {
      const payout = payoutByKey.get(entry.key) ?? null;
      const dueDate = payoutDueDate(entry, frequency, school.payoutDay);
      return {
        ...entry,
        amount: Math.round(entry.amount * 100) / 100,
        dueDate,
        status: payoutStatus(entry, dueDate, !!payout, now),
        payout,
      };
    })
    .sort((a, b) => (a.start < b.start ? 1 : -1));
}

const schoolInput = {
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  payoutFrequency: z.enum(["monthly", "biweekly", "weekly", "per_lesson"]),
  payoutDay: z.number().int().min(0).max(31).nullable().optional(),
  payoutAnchor: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
};

export const schoolsRouter = router({
  list: protectedProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(schools.userId, ctx.session.user.id)];
      if (!input?.includeArchived) conditions.push(eq(schools.archived, false));
      const rows = await ctx.db
        .select()
        .from(schools)
        .where(and(...conditions))
        .orderBy(asc(schools.name));

      const studentRows = await ctx.db
        .select()
        .from(students)
        .where(eq(students.userId, ctx.session.user.id));

      const now = new Date();
      const allLessons = await ctx.db
        .select()
        .from(lessons)
        .where(eq(lessons.userId, ctx.session.user.id));
      const studentIds = studentRows.map((s) => s.id);
      const rates = studentIds.length
        ? await ctx.db
            .select()
            .from(studentRates)
            .where(inArray(studentRates.studentId, studentIds))
        : [];
      const allPayouts = await ctx.db
        .select()
        .from(schoolPayouts)
        .where(eq(schoolPayouts.userId, ctx.session.user.id));
      const settlements = settleLessons(allLessons, rates);
      const schoolOfStudent = new Map(studentRows.map((s) => [s.id, s.schoolId]));

      return rows.map((school) => {
        const own = allLessons.filter(
          (l) =>
            schoolOfStudent.get(l.studentId) === school.id && l.status !== "cancelled",
        );
        const awaiting = own
          .filter((l) => !l.paid && l.startsAt <= now)
          .reduce((sum, l) => sum + (settlements.get(l.id)?.price ?? 0), 0);
        const received = allPayouts
          .filter((p) => p.schoolId === school.id)
          .reduce((sum, p) => sum + Number(p.amount), 0);
        return {
          ...school,
          studentCount: studentRows.filter((s) => s.schoolId === school.id).length,
          lessonCount: own.length,
          awaiting: Math.round(awaiting * 100) / 100,
          received: Math.round(received * 100) / 100,
        };
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const school = await assertOwnsSchool(ctx.db, ctx.session.user.id, input.id);
      const { studentRows, lessonRows, rates } = await schoolLessons(
        ctx.db,
        ctx.session.user.id,
        input.id,
      );
      const payouts = await ctx.db
        .select()
        .from(schoolPayouts)
        .where(eq(schoolPayouts.schoolId, input.id));

      const now = new Date();
      const periods = buildPeriods(school, lessonRows, rates, payouts, now);
      const settlements = settleLessons(lessonRows, rates);
      const awaiting = lessonRows
        .filter((l) => l.status !== "cancelled" && !l.paid && l.startsAt <= now)
        .reduce((sum, l) => sum + (settlements.get(l.id)?.price ?? 0), 0);

      return {
        ...school,
        students: studentRows,
        periods,
        totals: {
          awaiting: Math.round(awaiting * 100) / 100,
          received:
            Math.round(payouts.reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100,
          lessonCount: lessonRows.filter((l) => l.status !== "cancelled").length,
        },
      };
    }),

  create: protectedProcedure
    .input(z.object(schoolInput))
    .mutation(async ({ ctx, input }) => {
      const [school] = await ctx.db
        .insert(schools)
        .values({ ...input, userId: ctx.session.user.id })
        .returning();
      if (!school) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return school;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        ...schoolInput,
        name: schoolInput.name.optional(),
        payoutFrequency: schoolInput.payoutFrequency.optional(),
        archived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsSchool(ctx.db, ctx.session.user.id, input.id);
      const { id, ...rest } = input;
      const [updated] = await ctx.db
        .update(schools)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(schools.id, id))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnsSchool(ctx.db, ctx.session.user.id, input.id);
      await ctx.db.delete(schools).where(eq(schools.id, input.id));
      return { success: true };
    }),

  markPayout: protectedProcedure
    .input(
      z.object({
        schoolId: z.string().uuid(),
        periodKey: z.string().min(1),
        receivedOn: z.string().optional(),
        amount: z.coerce.number().nonnegative().optional(),
        note: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const school = await assertOwnsSchool(ctx.db, userId, input.schoolId);
      const { lessonRows, rates } = await schoolLessons(ctx.db, userId, input.schoolId);
      const existing = await ctx.db
        .select()
        .from(schoolPayouts)
        .where(eq(schoolPayouts.schoolId, input.schoolId));

      const period = buildPeriods(school, lessonRows, rates, existing, new Date()).find(
        (p) => p.key === input.periodKey,
      );
      if (!period) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono okresu" });
      }
      if (period.payout) return period.payout;

      const receivedOn = input.receivedOn ?? new Date().toISOString().slice(0, 10);
      const [payout] = await ctx.db
        .insert(schoolPayouts)
        .values({
          userId,
          schoolId: input.schoolId,
          periodKey: period.key,
          periodStart: period.start,
          periodEnd: period.end,
          amount: (input.amount ?? period.amount).toString(),
          receivedOn,
          note: input.note ?? null,
        })
        .returning();
      if (!payout) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (period.lessonIds.length) {
        const settlements = settleLessons(lessonRows, rates);
        for (const lessonId of period.lessonIds) {
          await ctx.db
            .update(lessons)
            .set({
              paid: true,
              paymentMethod: "transfer",
              paidAmount: (settlements.get(lessonId)?.price ?? 0).toString(),
              schoolPayoutId: payout.id,
              updatedAt: new Date(),
            })
            .where(and(eq(lessons.id, lessonId), eq(lessons.userId, userId)));
        }
      }

      return payout;
    }),

  unmarkPayout: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [payout] = await ctx.db
        .select()
        .from(schoolPayouts)
        .where(and(eq(schoolPayouts.id, input.id), eq(schoolPayouts.userId, userId)));
      if (!payout) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono przelewu" });
      }

      await ctx.db
        .update(lessons)
        .set({
          paid: false,
          paymentMethod: null,
          paidAmount: null,
          schoolPayoutId: null,
          updatedAt: new Date(),
        })
        .where(and(eq(lessons.schoolPayoutId, payout.id), eq(lessons.userId, userId)));
      await ctx.db.delete(schoolPayouts).where(eq(schoolPayouts.id, payout.id));
      return { success: true };
    }),
});
