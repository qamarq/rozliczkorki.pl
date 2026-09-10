import type { studentRates } from "@repo/db";

type Rate = typeof studentRates.$inferSelect;

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
