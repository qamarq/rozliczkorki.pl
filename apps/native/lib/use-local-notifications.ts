import { addDays, format, startOfToday, subDays } from "date-fns";
import { useEffect, useMemo } from "react";
import { useNotificationPrefs } from "./notification-prefs";
import { ensureNotificationChannels, syncLessonNotifications } from "./notifications";
import { trpc } from "./trpc";

const NO_LESSONS: never[] = [];

export function useLocalNotificationsSync(enabled: boolean) {
  const { prefs, loaded } = useNotificationPrefs();
  const day = format(new Date(), "yyyy-MM-dd");
  // The range must be stable across renders, otherwise every render creates a new query key.
  const range = useMemo(() => {
    const today = startOfToday();
    return {
      from: subDays(today, 14).toISOString(),
      to: addDays(today, 60).toISOString(),
    };
  }, [day]);

  const { data: lessons = NO_LESSONS, isSuccess } = trpc.lessons.range.useQuery(range, {
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    ensureNotificationChannels();
  }, [enabled]);

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
  }, [enabled, loaded, isSuccess, lessons, prefs]);
}
