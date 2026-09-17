import { format } from "date-fns";
import { pl } from "date-fns/locale";

export type PayoutFrequency = "monthly" | "biweekly" | "weekly" | "per_lesson";

export const PAYOUT_FREQUENCIES: PayoutFrequency[] = [
  "monthly",
  "biweekly",
  "weekly",
  "per_lesson",
];

export const PAYOUT_FREQUENCY_LABELS: Record<PayoutFrequency, string> = {
  monthly: "Co miesiąc",
  biweekly: "Co dwa tygodnie",
  weekly: "Co tydzień",
  per_lesson: "Po każdych zajęciach",
};

export const PAYOUT_DAY_HINTS: Record<PayoutFrequency, string> = {
  monthly: "Dzień miesiąca, do którego szkółka przelewa wynagrodzenie",
  biweekly: "Dzień tygodnia, w którym szkółka przelewa wynagrodzenie",
  weekly: "Dzień tygodnia, w którym szkółka przelewa wynagrodzenie",
  per_lesson: "Rozliczenie następuje po każdych zajęciach",
};

export const WEEKDAY_NAMES = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

export type PayoutStatus = "paid" | "due" | "pending" | "open";

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  paid: "Przelew przyszedł",
  due: "Po terminie",
  pending: "Czeka na przelew",
  open: "Okres w toku",
};

export type LessonPaymentState = "paid" | "awaiting_payout" | "unpaid" | "upcoming";

export const LESSON_PAYMENT_STATE_LABELS: Record<LessonPaymentState, string> = {
  paid: "Opłacone",
  awaiting_payout: "Do wypłaty",
  unpaid: "Nieopłacone",
  upcoming: "Nierozliczone",
};

export type PayoutPeriod = {
  key: string;
  label: string;
  start: string;
  end: string;
};

const iso = (date: Date) => format(date, "yyyy-MM-dd");

const atNoon = (value: string) => new Date(`${value}T12:00:00`);

function startOfWeek(date: Date) {
  const result = new Date(date);
  const weekday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - weekday);
  result.setHours(12, 0, 0, 0);
  return result;
}

const DEFAULT_ANCHOR = "2024-01-01";

/**
 * Two-week blocks are counted from the school's anchor Monday, so a payout
 * period keeps its identity even when a fortnight has no lessons at all.
 */
function biweeklyStart(date: Date, anchor: string | null) {
  const base = startOfWeek(atNoon(anchor ?? DEFAULT_ANCHOR));
  const current = startOfWeek(date);
  const weeks = Math.floor((current.getTime() - base.getTime()) / (7 * 86400000));
  const blocks = Math.floor(weeks / 2);
  const start = new Date(base);
  start.setDate(start.getDate() + blocks * 14);
  return start;
}

export function payoutPeriodOf(
  date: Date,
  frequency: PayoutFrequency,
  anchor: string | null = null,
): PayoutPeriod {
  if (frequency === "per_lesson") {
    const day = iso(date);
    return {
      key: day,
      label: format(date, "d MMMM yyyy", { locale: pl }),
      start: day,
      end: day,
    };
  }

  if (frequency === "monthly") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
    return {
      key: format(start, "yyyy-MM"),
      label: format(start, "LLLL yyyy", { locale: pl }),
      start: iso(start),
      end: iso(end),
    };
  }

  const start = frequency === "weekly" ? startOfWeek(date) : biweeklyStart(date, anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + (frequency === "weekly" ? 6 : 13));
  return {
    key: iso(start),
    label: `${format(start, "d MMM", { locale: pl })} – ${format(end, "d MMM yyyy", { locale: pl })}`,
    start: iso(start),
    end: iso(end),
  };
}

export function payoutDueDate(
  period: PayoutPeriod,
  frequency: PayoutFrequency,
  payoutDay: number | null,
): string | null {
  const end = atNoon(period.end);

  if (frequency === "per_lesson") return period.end;

  if (frequency === "monthly") {
    if (payoutDay == null) return null;
    const year = end.getFullYear();
    const month = end.getMonth() + 1;
    const lastDay = new Date(year, month + 1, 0, 12).getDate();
    return iso(new Date(year, month, Math.min(payoutDay, lastDay), 12));
  }

  if (payoutDay == null) return null;
  const due = new Date(end);
  due.setDate(due.getDate() + 1);
  while (due.getDay() !== payoutDay) due.setDate(due.getDate() + 1);
  return iso(due);
}

export function payoutStatus(
  period: PayoutPeriod,
  dueDate: string | null,
  isPaid: boolean,
  today: Date,
): PayoutStatus {
  if (isPaid) return "paid";
  const now = iso(today);
  if (period.end >= now) return "open";
  if (dueDate && dueDate < now) return "due";
  return "pending";
}

export function formatPayoutSchedule(
  frequency: PayoutFrequency,
  payoutDay: number | null,
) {
  const base = PAYOUT_FREQUENCY_LABELS[frequency];
  if (payoutDay == null || frequency === "per_lesson") return base;
  if (frequency === "monthly")
    return `${base}, do ${payoutDay}. dnia następnego miesiąca`;
  return `${base}, w ${WEEKDAY_NAMES[payoutDay]?.toLowerCase()}`;
}

export function lessonPaymentState({
  settled,
  startsAt,
  hasSchool,
  now = new Date(),
}: {
  settled: boolean;
  startsAt: Date;
  hasSchool: boolean;
  now?: Date;
}): LessonPaymentState {
  if (settled) return "paid";
  if (hasSchool) return "awaiting_payout";
  if (startsAt > now) return "upcoming";
  return "unpaid";
}
