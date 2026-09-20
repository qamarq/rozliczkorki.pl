import { format } from "date-fns";
import { pl } from "date-fns/locale";

export type LessonMode = "in_person" | "remote";
export type LessonStatus = "scheduled" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "transfer";

export const LESSON_MODE_LABELS: Record<LessonMode, string> = {
  in_person: "Stacjonarnie",
  remote: "Online",
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: "Zaplanowane",
  completed: "Odbyły się",
  cancelled: "Odwołane",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Gotówka",
  transfer: "Przelew",
};

export function pluralize(n: number, one: string, few: string, many: string) {
  if (n === 1) return `${n} ${one}`;
  const few_ = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${n} ${few_ ? few : many}`;
}

export function localDayRange(startDate: string, endDate: string) {
  return {
    from: new Date(`${startDate}T00:00:00`).toISOString(),
    to: new Date(`${endDate}T23:59:59.999`).toISOString(),
  };
}

export function formatVacationRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00`);
  const end = new Date(`${endDate}T00:00`);
  if (startDate === endDate) return format(start, "d MMM yyyy", { locale: pl });
  return `${format(start, "d MMM", { locale: pl })} – ${format(end, "d MMM yyyy", { locale: pl })}`;
}

export function lessonEndsAt(lesson: { startsAt: Date; durationMinutes: number }) {
  return new Date(lesson.startsAt.getTime() + lesson.durationMinutes * 60_000);
}
