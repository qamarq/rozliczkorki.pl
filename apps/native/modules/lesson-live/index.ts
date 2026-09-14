import { requireOptionalNativeModule } from "expo";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

type LessonLiveModule = {
  sync(lessonsJson: string): void;
  canPostPromotedNotifications(): boolean;
  openPromotedNotificationSettings(): boolean;
};

export type LiveLesson = {
  id: string;
  studentName: string;
  startsAt: number;
  endsAt: number;
  paid: boolean;
};

export const LIVE_WRAP_UP_MS = 20 * 60 * 1000;

const native = requireOptionalNativeModule<LessonLiveModule>("LessonLive");

export function syncLiveLessons(lessons: LiveLesson[]) {
  native?.sync(JSON.stringify(lessons));
}

export function canPostLiveUpdates() {
  return native ? native.canPostPromotedNotifications() : true;
}

export function openLiveUpdateSettings() {
  return native ? native.openPromotedNotificationSettings() : false;
}

export function useLiveUpdatesAllowed() {
  const [allowed, setAllowed] = useState(canPostLiveUpdates);
  const refresh = useCallback(() => setAllowed(canPostLiveUpdates()), []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return allowed;
}
