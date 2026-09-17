import { lessons, students, vacations } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;
}

function daysInYear(start: string, end: string, year: number) {
  const from = start > `${year}-01-01` ? start : `${year}-01-01`;
  const to = end < `${year}-12-31` ? end : `${year}-12-31`;
  return from > to ? 0 : daysBetween(from, to);
}

async function planVacationChange(
  db: (typeof import("@repo/db"))["db"],
  userId: string,
  range: { from: string; to: string },
  vacationId?: string,
) {
  const from = new Date(range.from);
  const to = new Date(range.to);

  const existing = vacationId
    ? (
        await db
          .select()
          .from(vacations)
          .where(and(eq(vacations.id, vacationId), eq(vacations.userId, userId)))
      )[0]
    : undefined;
  if (vacationId && !existing) throw new TRPCError({ code: "NOT_FOUND" });

  const candidates = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      mode: lessons.mode,
      studentId: lessons.studentId,
      studentName: students.name,
    })
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(
      and(
        eq(lessons.userId, userId),
        eq(lessons.status, "scheduled"),
        isNull(lessons.vacationId),
        gte(lessons.startsAt, from),
        lte(lessons.startsAt, to),
      ),
    )
    .orderBy(asc(lessons.startsAt));

  // Scheduled lessons already inside the old range were kept, restored or added on purpose.
  const toCancel = existing
    ? candidates.filter(
        (l) => l.startsAt < existing.startsAt || l.startsAt > existing.endsAt,
      )
    : candidates;

  const toRestore = existing
    ? await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(
          and(
            eq(lessons.userId, userId),
            eq(lessons.vacationId, existing.id),
            eq(lessons.status, "cancelled"),
            or(lt(lessons.startsAt, from), gt(lessons.startsAt, to)),
          ),
        )
    : [];

  return { existing, toCancel, toRestore };
}

const rangeInput = z
  .object({
    startDate: dateString,
    endDate: dateString,
    // Local start of startDate and end of endDate, sent by the client.
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "Data końca urlopu nie może być wcześniejsza niż data początku",
  });

const vacationDetailsInput = z.object({
  note: z.string().optional(),
  keepLessonIds: z.array(z.string().uuid()).default([]),
});

async function cancelForVacation(
  db: (typeof import("@repo/db"))["db"],
  vacationId: string,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) return 0;
  const cancelled = await db
    .update(lessons)
    .set({
      status: "cancelled",
      vacationId,
      studentNotified: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(lessons.id, lessonIds),
        eq(lessons.status, "scheduled"),
        isNull(lessons.vacationId),
      ),
    )
    .returning({ id: lessons.id });
  return cancelled.length;
}

export const vacationsRouter = router({
  overview: protectedProcedure
    .input(z.object({ today: dateString }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const vacationRows = await ctx.db
        .select()
        .from(vacations)
        .where(eq(vacations.userId, userId))
        .orderBy(desc(vacations.startDate));

      const vacationIds = vacationRows.map((v) => v.id);
      const lessonRows = vacationIds.length
        ? await ctx.db
            .select({
              id: lessons.id,
              vacationId: lessons.vacationId,
              startsAt: lessons.startsAt,
              mode: lessons.mode,
              studentNotified: lessons.studentNotified,
              studentId: students.id,
              studentName: students.name,
              studentPhone: students.phone,
            })
            .from(lessons)
            .innerJoin(students, eq(students.id, lessons.studentId))
            .where(
              and(eq(lessons.userId, userId), inArray(lessons.vacationId, vacationIds)),
            )
            .orderBy(asc(lessons.startsAt))
        : [];

      const items = vacationRows.map((vacation) => {
        const byStudent = new Map<
          string,
          {
            studentId: string;
            name: string;
            phone: string | null;
            notified: boolean;
            lessons: { id: string; startsAt: Date; mode: "in_person" | "remote" }[];
          }
        >();
        for (const lesson of lessonRows) {
          if (lesson.vacationId !== vacation.id) continue;
          const entry = byStudent.get(lesson.studentId) ?? {
            studentId: lesson.studentId,
            name: lesson.studentName,
            phone: lesson.studentPhone,
            notified: true,
            lessons: [],
          };
          entry.notified &&= lesson.studentNotified;
          entry.lessons.push({
            id: lesson.id,
            startsAt: lesson.startsAt,
            mode: lesson.mode,
          });
          byStudent.set(lesson.studentId, entry);
        }
        const studentsToNotify = [...byStudent.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "pl"),
        );
        return {
          ...vacation,
          days: daysBetween(vacation.startDate, vacation.endDate),
          cancelledCount: studentsToNotify.reduce((sum, s) => sum + s.lessons.length, 0),
          students: studentsToNotify,
          past: vacation.endDate < input.today,
        };
      });

      const year = Number(input.today.slice(0, 4));
      const upcoming = items
        .filter((v) => v.startDate > input.today)
        .sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
      const pending = items
        .filter((v) => !v.past)
        .flatMap((v) =>
          v.students
            .filter((s) => !s.notified)
            .map((s) => ({
              ...s,
              vacationId: v.id,
              startDate: v.startDate,
              endDate: v.endDate,
            })),
        );

      return {
        vacations: items,
        pending,
        stats: {
          daysThisYear: items.reduce(
            (sum, v) => sum + daysInYear(v.startDate, v.endDate, year),
            0,
          ),
          current: items.find((v) => v.startDate <= input.today && !v.past) ?? null,
          next: upcoming[0] ?? null,
          cancelledThisYear: items
            .filter((v) => daysInYear(v.startDate, v.endDate, year) > 0)
            .reduce((sum, v) => sum + v.cancelledCount, 0),
          toNotify: pending.length,
        },
      };
    }),

  preview: protectedProcedure
    .input(
      z.intersection(rangeInput, z.object({ vacationId: z.string().uuid().optional() })),
    )
    .query(async ({ ctx, input }) => {
      const plan = await planVacationChange(
        ctx.db,
        ctx.session.user.id,
        input,
        input.vacationId,
      );
      return { toCancel: plan.toCancel, restoreCount: plan.toRestore.length };
    }),

  create: protectedProcedure
    .input(z.intersection(rangeInput, vacationDetailsInput))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { toCancel } = await planVacationChange(ctx.db, userId, input);
      const [vacation] = await ctx.db
        .insert(vacations)
        .values({
          userId,
          startDate: input.startDate,
          endDate: input.endDate,
          startsAt: new Date(input.from),
          endsAt: new Date(input.to),
          note: input.note?.trim() || null,
        })
        .returning();
      if (!vacation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const cancelledCount = await cancelForVacation(
        ctx.db,
        vacation.id,
        toCancel.map((l) => l.id).filter((id) => !input.keepLessonIds.includes(id)),
      );
      return { ...vacation, cancelledCount };
    }),

  update: protectedProcedure
    .input(
      z.intersection(rangeInput, vacationDetailsInput.extend({ id: z.string().uuid() })),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { existing, toCancel, toRestore } = await planVacationChange(
        ctx.db,
        userId,
        input,
        input.id,
      );

      if (toRestore.length > 0) {
        await ctx.db
          .update(lessons)
          .set({
            status: "scheduled",
            vacationId: null,
            studentNotified: false,
            updatedAt: new Date(),
          })
          .where(
            inArray(
              lessons.id,
              toRestore.map((l) => l.id),
            ),
          );
      }

      const [vacation] = await ctx.db
        .update(vacations)
        .set({
          startDate: input.startDate,
          endDate: input.endDate,
          startsAt: new Date(input.from),
          endsAt: new Date(input.to),
          note: input.note?.trim() || null,
        })
        .where(eq(vacations.id, existing!.id))
        .returning();

      const cancelledCount = await cancelForVacation(
        ctx.db,
        existing!.id,
        toCancel.map((l) => l.id).filter((id) => !input.keepLessonIds.includes(id)),
      );
      return { ...vacation!, cancelledCount, restoredCount: toRestore.length };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [vacation] = await ctx.db
        .select()
        .from(vacations)
        .where(and(eq(vacations.id, input.id), eq(vacations.userId, userId)));
      if (!vacation) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(lessons)
        .set({
          status: "scheduled",
          vacationId: null,
          studentNotified: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(lessons.userId, userId),
            eq(lessons.vacationId, vacation.id),
            eq(lessons.status, "cancelled"),
          ),
        );
      await ctx.db.delete(vacations).where(eq(vacations.id, vacation.id));
      return { success: true };
    }),

  setNotified: protectedProcedure
    .input(
      z.object({
        vacationId: z.string().uuid(),
        studentId: z.string().uuid(),
        notified: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(lessons)
        .set({ studentNotified: input.notified, updatedAt: new Date() })
        .where(
          and(
            eq(lessons.userId, ctx.session.user.id),
            eq(lessons.vacationId, input.vacationId),
            eq(lessons.studentId, input.studentId),
          ),
        );
      return { success: true };
    }),
});
