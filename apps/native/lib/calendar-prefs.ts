import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "calendar-default-view";

export type CalendarView = "month" | "week" | "list";

export const CALENDAR_VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Miesiąc" },
  { value: "week", label: "Tydzień" },
  { value: "list", label: "Lista" },
];

const DEFAULT_VIEW: CalendarView = "month";
const listeners = new Set<(view: CalendarView) => void>();

function parse(raw: string | null): CalendarView {
  return CALENDAR_VIEW_OPTIONS.some((o) => o.value === raw)
    ? (raw as CalendarView)
    : DEFAULT_VIEW;
}

export function useDefaultCalendarView() {
  const [view, setView] = useState<CalendarView | null>(null);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (active) setView(parse(raw));
    });
    listeners.add(setView);
    return () => {
      active = false;
      listeners.delete(setView);
    };
  }, []);

  const update = useCallback(async (next: CalendarView) => {
    listeners.forEach((l) => l(next));
    await SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  return { view: view ?? DEFAULT_VIEW, loaded: view != null, update };
}
