import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "notification-prefs";

export type NotificationChannelKey = "upcoming" | "overdue" | "live";

export type NotificationPrefs = {
  upcomingMinutesBefore: number;
  overdueDaysAfter: number;
  channels: Record<NotificationChannelKey, boolean>;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  upcomingMinutesBefore: 60,
  overdueDaysAfter: 3,
  channels: { upcoming: true, overdue: true, live: true },
};

export const NOTIFICATION_CHANNEL_OPTIONS: {
  key: NotificationChannelKey;
  label: string;
  description: string;
}[] = [
  {
    key: "upcoming",
    label: "Przypomnienie przed zajęciami",
    description: "Powiadomienie chwilę przed zaplanowanymi zajęciami.",
  },
  {
    key: "overdue",
    label: "Przypomnienie o nieopłaconych",
    description: "Po zajęciach, które wciąż nie są oznaczone jako opłacone.",
  },
  {
    key: "live",
    label: "Zajęcia na żywo",
    description:
      "Powiadomienie z postępem przez całe zajęcia i chwilę po nich — do oznaczenia płatności.",
  },
];

export const UPCOMING_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 godz." },
  { value: 120, label: "2 godz." },
  { value: 1440, label: "1 dzień" },
];

export const OVERDUE_OPTIONS = [
  { value: 1, label: "1 dzień" },
  { value: 3, label: "3 dni" },
  { value: 7, label: "7 dni" },
  { value: 14, label: "14 dni" },
];

function parse(raw: string | null): NotificationPrefs {
  if (!raw) return DEFAULT_NOTIFICATION_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    const defaults = DEFAULT_NOTIFICATION_PREFS;
    return {
      upcomingMinutesBefore:
        typeof parsed.upcomingMinutesBefore === "number"
          ? parsed.upcomingMinutesBefore
          : defaults.upcomingMinutesBefore,
      overdueDaysAfter:
        typeof parsed.overdueDaysAfter === "number"
          ? parsed.overdueDaysAfter
          : defaults.overdueDaysAfter,
      channels: {
        upcoming: parsed.channels?.upcoming ?? defaults.channels.upcoming,
        overdue: parsed.channels?.overdue ?? defaults.channels.overdue,
        live: parsed.channels?.live ?? defaults.channels.live,
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function readNotificationPrefs(): Promise<NotificationPrefs> {
  return parse(await SecureStore.getItemAsync(STORAGE_KEY));
}

const listeners = new Set<(prefs: NotificationPrefs) => void>();

export async function writeNotificationPrefs(prefs: NotificationPrefs) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs));
  listeners.forEach((l) => l(prefs));
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    let active = true;
    readNotificationPrefs().then((p) => {
      if (active) setPrefs(p);
    });
    listeners.add(setPrefs);
    return () => {
      active = false;
      listeners.delete(setPrefs);
    };
  }, []);

  const update = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      const next = { ...(prefs ?? DEFAULT_NOTIFICATION_PREFS), ...patch };
      setPrefs(next);
      await writeNotificationPrefs(next);
    },
    [prefs],
  );

  return { prefs: prefs ?? DEFAULT_NOTIFICATION_PREFS, loaded: prefs != null, update };
}
