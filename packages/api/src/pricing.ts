import type { lessons, studentRates } from "@repo/db";

type Rate = typeof studentRates.$inferSelect;
type Lesson = typeof lessons.$inferSelect;

export function rateEffectiveOn(rates: Rate[], date: Date): Rate | undefined {
  const dateStr = date.toISOString().slice(0, 10);
  return rates
    .filter((r) => r.effectiveFrom <= dateStr)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0];
}

export function lessonPrice(
  lesson: {
    startsAt: Date;
    durationMinutes: number;
    priceOverride: string | null;
    prorate: boolean;
  },
  rates: Rate[],
): number {
  if (lesson.priceOverride != null) {
    return Number(lesson.priceOverride);
  }
  const rate = rateEffectiveOn(rates, lesson.startsAt);
  if (!rate) return 0;
  if (!lesson.prorate) {
    return Number(rate.hourlyRate);
  }
  return (Number(rate.hourlyRate) * lesson.durationMinutes) / 60;
}

export type Settlement = {
  price: number;
  carry: number;
  amountDue: number;
  received: number;
  outstanding: number;
  settled: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function settleLessons(history: Lesson[], rates: Rate[]) {
  const result = new Map<string, Settlement>();
  const byStudent = new Map<string, Lesson[]>();
  for (const lesson of history) {
    const list = byStudent.get(lesson.studentId) ?? [];
    list.push(lesson);
    byStudent.set(lesson.studentId, list);
  }

  for (const [studentId, list] of byStudent) {
    const studentRates = rates.filter((r) => r.studentId === studentId);
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    let balance = 0;
    let last: Settlement | undefined;

    for (const lesson of list) {
      const price = round(lessonPrice(lesson, studentRates));

      if (lesson.status === "cancelled") {
        result.set(lesson.id, {
          price,
          carry: balance,
          amountDue: 0,
          received: 0,
          outstanding: 0,
          settled: lesson.paid,
        });
        continue;
      }

      const carry = balance;
      const amountDue = round(Math.max(0, price - carry));
      let entry: Settlement;

      if (lesson.paid) {
        const received =
          lesson.paidAmount != null ? Number(lesson.paidAmount) : amountDue;
        balance = round(carry + received - price);
        entry = { price, carry, amountDue, received, outstanding: 0, settled: true };
      } else {
        balance = carry >= price ? round(carry - price) : 0;
        entry = {
          price,
          carry,
          amountDue,
          received: 0,
          outstanding: amountDue,
          settled: amountDue === 0,
        };
      }

      result.set(lesson.id, entry);
      last = entry;
    }

    if (last && balance < 0) {
      last.outstanding = round(last.outstanding - balance);
    }
  }

  return result;
}
