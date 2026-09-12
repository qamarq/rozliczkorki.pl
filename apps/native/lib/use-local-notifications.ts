import { addDays, subDays } from "date-fns";
import { useEffect } from "react";
import { useNotificationPrefs } from "./notification-prefs";
import { ensureNotificationChannels, syncLessonNotifications } from "./notifications";
import { trpc } from "./trpc";

export function useLocalNotificationsSync(enabled: boolean) {
  const { prefs, loaded } = useNotificationPrefs();
  const from = subDays(new Date(), 14);
  const to = addDays(new Date(), 60);

  const { data: lessons = [] } = trpc.lessons.range.useQuery(
    { from: from.toISOString(), to: to.toISOString() },
    { enabled },
  );

  useEffect(() => {
    if (!enabled) return;
    ensureNotificationChannels();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !loaded) return;
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
  }, [enabled, loaded, lessons, prefs]);
}
