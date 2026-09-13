import { addDays, format, startOfToday, subDays } from "date-fns";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { canScheduleExactAlarms, openExactAlarmSettings } from "@/modules/exact-alarms";
import { alert } from "./alert";
import { useNotificationPrefs } from "./notification-prefs";
import { ensureNotificationChannels, syncLessonNotifications } from "./notifications";
import { trpc } from "./trpc";

const NO_LESSONS: never[] = [];
const EXACT_PROMPT_KEY = "exact-alarms-prompted";

async function promptForExactAlarms() {
  if (canScheduleExactAlarms()) return;
  if (await SecureStore.getItemAsync(EXACT_PROMPT_KEY)) return;
  await SecureStore.setItemAsync(EXACT_PROMPT_KEY, "1");
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
    syncLessonNotifications(
      lessons
        .filter((l) => l.student != null)
        .map((l) => ({
          id: l.id,
          startsAt: l.startsAt,
          status: l.status,
          paid: l.paid,
          studentName: l.student!.name,
        })),
      prefs,
    );
  }, [enabled, loaded, isSuccess, lessons, prefs, resumeTick]);
}
