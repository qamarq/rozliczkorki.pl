import { addDays, format, startOfToday, subDays } from "date-fns";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { canScheduleExactAlarms, openExactAlarmSettings } from "@/modules/exact-alarms";
import { LIVE_WRAP_UP_MS, syncLiveLessons } from "@/modules/lesson-live";
import { alert } from "./alert";
import { useNotificationPrefs } from "./notification-prefs";
import {
  EXACT_ALARMS_PROMPTED_KEY,
  ensureNotificationChannels,
  syncLessonNotifications,
} from "./notifications";
import { trpc } from "./trpc";

const NO_LESSONS: never[] = [];
const LIVE_HORIZON_MS = 7 * 24 * 60 * 60 * 1000;

async function promptForExactAlarms() {
  if (canScheduleExactAlarms()) return;
  if (await SecureStore.getItemAsync(EXACT_ALARMS_PROMPTED_KEY)) return;
  await SecureStore.setItemAsync(EXACT_ALARMS_PROMPTED_KEY, "1");
  alert(
    "Przypomnienia na czas",
    "Żeby przypomnienia o zajęciach przychodziły dokładnie o ustawionej porze, zezwól aplikacji na ustawianie alarmów i przypomnień.",
    [
      { text: "Nie teraz", style: "cancel" },
      { text: "Zezwól", onPress: () => openExactAlarmSettings() },
    ],
  );
}

export function useLocalNotificationsSync(enabled: boolean) {
  const { prefs, loaded } = useNotificationPrefs();
  const [resumeTick, setResumeTick] = useState(0);
  const day = format(new Date(), "yyyy-MM-dd");
  // The range must be stable across renders, otherwise every render creates a new query key.
  const range = useMemo(() => {
    const today = startOfToday();
    return {
      from: subDays(today, 14).toISOString(),
      to: addDays(today, 60).toISOString(),
    };
  }, [day]);

  const {
    data: lessons = NO_LESSONS,
    isSuccess,
    refetch,
  } = trpc.lessons.range.useQuery(range, { enabled });

  useEffect(() => {
    if (!enabled) return;
    ensureNotificationChannels();
    promptForExactAlarms();
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      setResumeTick((t) => t + 1);
      refetch();
    });
    return () => sub.remove();
  }, [enabled, refetch]);

  useEffect(() => {
    if (!enabled || !loaded || !isSuccess) return;
    const withStudents = lessons.filter((l) => l.student != null);

    syncLessonNotifications(
      withStudents.map((l) => ({
        id: l.id,
        startsAt: l.startsAt,
        status: l.status,
        paid: l.settled,
        studentName: l.student!.name,
      })),
      prefs,
    );

    const now = Date.now();
    syncLiveLessons(
      prefs.channels.live
        ? withStudents
            .filter((l) => l.status !== "cancelled")
            .map((l) => {
              const startsAt = new Date(l.startsAt).getTime();
              return {
                id: l.id,
                studentName: l.student!.name,
                startsAt,
                endsAt: startsAt + l.durationMinutes * 60 * 1000,
                paid: l.settled,
              };
            })
            .filter(
              (l) =>
                l.endsAt + LIVE_WRAP_UP_MS > now && l.startsAt < now + LIVE_HORIZON_MS,
            )
        : [],
    );
  }, [enabled, loaded, isSuccess, lessons, prefs, resumeTick]);
}
