export type LessonMode = "in_person" | "remote";

export const LESSON_MODE_LABELS: Record<LessonMode, string> = {
  in_person: "Stacjonarnie",
  remote: "Online",
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
