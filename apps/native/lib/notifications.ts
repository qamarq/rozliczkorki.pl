import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "./notification-prefs";

export const NOTIFICATION_CHANNELS = {
  upcoming: "upcoming-lessons",
  overdue: "overdue-payments",
} as const;

const REMINDED_KEY = "reminded-lessons";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.upcoming, {
    name: "Nadchodzące zajęcia",
    description: "Przypomnienia przed zaplanowanymi zajęciami.",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.overdue, {
    name: "Zaległe płatności",
    description: "Przypomnienia o zajęciach, które wciąż nie są oznaczone jako opłacone.",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return requested.granted;
}

type LessonForNotif = {
  id: string;
  startsAt: string | Date;
  status: "scheduled" | "completed" | "cancelled";
  paid: boolean;
  studentName: string;
};

type NotifKind = "upcoming" | "overdue";

function leadLabel(minutes: number) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return days === 1 ? "dzień" : `${days} dni`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    if (hours === 1) return "godzinę";
    return hours < 5 ? `${hours} godziny` : `${hours} godzin`;
  }
  return `${minutes} min`;
}

function buildTag(kind: NotifKind, lessonId: string) {
  return `${kind}:${lessonId}`;
}

async function loadReminded(): Promise<Record<string, number>> {
  try {
    const raw = await SecureStore.getItemAsync(REMINDED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

let syncQueue: Promise<void> = Promise.resolve();

export function syncLessonNotifications(
  lessons: LessonForNotif[],
  prefs: NotificationPrefs = DEFAULT_NOTIFICATION_PREFS,
) {
  syncQueue = syncQueue
    .then(() => runSync(lessons, prefs))
    .catch((e) => console.warn("Lesson notification sync failed", e));
  return syncQueue;
}

async function runSync(lessons: LessonForNotif[], prefs: NotificationPrefs) {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const now = Date.now();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingByTag = new Map<string, string>();
  for (const req of scheduled) {
    const tag = req.content.data?.tag;
    if (typeof tag === "string") existingByTag.set(tag, req.identifier);
  }

  // Lessons we already reminded about (or scheduled a reminder for), keyed by id and start time.
  const stored = await loadReminded();
  const reminded: Record<string, number> = {};
  for (const [key, startsAt] of Object.entries(stored)) {
    if (startsAt > now) reminded[key] = startsAt;
  }

  const desired = new Map<
    string,
    { fireAt: number | null; kind: NotifKind; lesson: LessonForNotif }
  >();

  for (const lesson of lessons) {
    const startsAt = new Date(lesson.startsAt).getTime();

    if (lesson.status === "scheduled" && startsAt > now) {
      const fireAt = startsAt - prefs.upcomingMinutesBefore * 60 * 1000;
      const key = `${lesson.id}:${startsAt}`;
      if (fireAt > now) {
        desired.set(buildTag("upcoming", lesson.id), {
          fireAt,
          kind: "upcoming",
          lesson,
        });
        reminded[key] = startsAt;
      } else if (!reminded[key]) {
        desired.set(buildTag("upcoming", lesson.id), {
          fireAt: null,
          kind: "upcoming",
          lesson,
        });
        reminded[key] = startsAt;
      }
    }

    if (lesson.status !== "cancelled" && !lesson.paid) {
      const fireAt = startsAt + prefs.overdueDaysAfter * 24 * 60 * 60 * 1000;
      if (fireAt > now) {
        desired.set(buildTag("overdue", lesson.id), { fireAt, kind: "overdue", lesson });
      }
    }
  }

  for (const [tag, identifier] of existingByTag) {
    if (!tag.startsWith("upcoming:") && !tag.startsWith("overdue:")) continue;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  for (const [tag, { fireAt, kind, lesson }] of desired) {
    const time = new Date(lesson.startsAt);
    const timeLabel = `${String(time.getHours()).padStart(2, "0")}:${String(
      time.getMinutes(),
    ).padStart(2, "0")}`;
    const minutesLeft = Math.max(1, Math.round((time.getTime() - now) / 60000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          kind === "upcoming"
            ? `Za ${leadLabel(fireAt == null ? minutesLeft : prefs.upcomingMinutesBefore)} masz zajęcia`
            : "Zaległa płatność za zajęcia",
        body:
          kind === "upcoming"
            ? `${lesson.studentName} o ${timeLabel}`
            : `${lesson.studentName} — zajęcia z ${time.toLocaleDateString("pl-PL")} wciąż nie są oznaczone jako opłacone.`,
        data: { tag, lessonId: lesson.id, kind },
      },
      trigger:
        fireAt == null
          ? { channelId: NOTIFICATION_CHANNELS[kind] }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(fireAt),
              channelId: NOTIFICATION_CHANNELS[kind],
            },
    });
  }

  await SecureStore.setItemAsync(REMINDED_KEY, JSON.stringify(reminded));
}
