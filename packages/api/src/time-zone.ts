import { z } from "zod";

export const DEFAULT_TIME_ZONE = "Europe/Warsaw";

export const timeZoneSchema = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
});

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function zonedParts(
  date: Date,
  timeZone: string,
): ZonedParts & { second: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function timeZoneOffsetMinutes(timeZone: string, date: Date) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

export function zonedDateTime(parts: ZonedParts, timeZone: string) {
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  let result = asUtc - timeZoneOffsetMinutes(timeZone, new Date(asUtc)) * 60_000;
  result = asUtc - timeZoneOffsetMinutes(timeZone, new Date(result)) * 60_000;
  return new Date(result);
}

// Moves a date by whole weeks while keeping its wall-clock time in the given zone across DST changes.
export function addWeeksInTimeZone(date: Date, weeks: number, timeZone: string) {
  const shifted = new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  const drift =
    timeZoneOffsetMinutes(timeZone, date) - timeZoneOffsetMinutes(timeZone, shifted);
  return new Date(shifted.getTime() + drift * 60_000);
}
