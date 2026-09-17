import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";

export type Range = { from: Date; to: Date };

export type PresetId =
  | "this-month"
  | "last-30"
  | "this-semester"
  | "last-semester"
  | "year"
  | "last-12-months"
  | "next-3-months"
  | "next-6-months";

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "this-month", label: "Ten miesiąc" },
  { id: "last-30", label: "Ostatnie 30 dni" },
  { id: "this-semester", label: "Ten semestr" },
  { id: "last-semester", label: "Zeszły semestr" },
  { id: "year", label: "Ten rok" },
  { id: "last-12-months", label: "Ostatnie 12 miesięcy" },
  { id: "next-3-months", label: "Najbliższe 3 miesiące" },
  { id: "next-6-months", label: "Przyszłe 6 miesięcy" },
];

// Semestry szkolne: zimowy 1.09–31.01, letni 1.02–30.06. W wakacje liczy się nadchodzący zimowy.
function semester(now: Date, offset: number): Range {
  const month = now.getMonth();
  const year = now.getFullYear();
  const autumn = month >= 8 || month === 0 || month === 6 || month === 7;
  const autumnYear = month === 0 ? year - 1 : year;

  let isAutumn = autumn;
  let anchor = autumn ? autumnYear : year;
  for (let i = 0; i < -offset; i++) {
    if (isAutumn) {
      isAutumn = false;
    } else {
      isAutumn = true;
      anchor -= 1;
    }
  }

  return isAutumn
    ? { from: new Date(anchor, 8, 1), to: endOfDay(new Date(anchor + 1, 0, 31)) }
    : { from: new Date(anchor, 1, 1), to: endOfDay(new Date(anchor, 5, 30)) };
}

export function presetRange(id: PresetId, now: Date): Range {
  switch (id) {
    case "last-30":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "this-semester":
      return semester(now, 0);
    case "last-semester":
      return semester(now, -1);
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last-12-months":
      return { from: startOfMonth(subMonths(now, 11)), to: endOfMonth(now) };
    case "next-3-months":
      return { from: startOfDay(now), to: endOfMonth(addMonths(now, 2)) };
    case "next-6-months":
      return { from: startOfDay(now), to: endOfMonth(addMonths(now, 5)) };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export type Granularity = "day" | "week" | "month";

export function granularityFor(range: Range): Granularity {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  if (days <= 62) return "day";
  if (days <= 280) return "week";
  return "month";
}

export function buildBuckets(range: Range, granularity: Granularity) {
  const clamp = (from: Date, to: Date) => ({
    from: from < range.from ? range.from : from,
    to: to > range.to ? range.to : to,
  });

  if (granularity === "day") {
    return eachDayOfInterval({ start: range.from, end: range.to }).map((day) => {
      const bounds = clamp(startOfDay(day), endOfDay(day));
      return {
        key: format(day, "yyyy-MM-dd"),
        label: format(day, "d MMM", { locale: pl }),
        from: bounds.from.toISOString(),
        to: bounds.to.toISOString(),
      };
    });
  }

  if (granularity === "week") {
    return eachWeekOfInterval(
      { start: range.from, end: range.to },
      { weekStartsOn: 1 },
    ).map((week) => {
      const bounds = clamp(startOfDay(week), endOfWeek(week, { weekStartsOn: 1 }));
      return {
        key: format(week, "yyyy-'W'II"),
        label: format(bounds.from, "d MMM", { locale: pl }),
        from: bounds.from.toISOString(),
        to: bounds.to.toISOString(),
      };
    });
  }

  return eachMonthOfInterval({ start: range.from, end: range.to }).map((month) => {
    const bounds = clamp(startOfMonth(month), endOfMonth(month));
    return {
      key: format(month, "yyyy-MM"),
      label: format(month, "LLL yy", { locale: pl }),
      from: bounds.from.toISOString(),
      to: bounds.to.toISOString(),
    };
  });
}

export function previousRange(range: Range): Range {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  return {
    from: startOfDay(subDays(range.from, days)),
    to: endOfDay(subDays(range.to, days)),
  };
}

export function formatRange(range: Range) {
  const sameYear = range.from.getFullYear() === range.to.getFullYear();
  const from = format(range.from, sameYear ? "d MMM" : "d MMM yyyy", { locale: pl });
  const to = format(range.to, "d MMM yyyy", { locale: pl });
  return `${from} – ${to}`;
}
