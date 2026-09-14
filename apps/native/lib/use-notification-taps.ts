import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { requestLessonSheet } from "./pending-lesson";

const handled = new Set<string>();

export function useNotificationTaps() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { identifier, content } = response.notification.request;
    if (handled.has(identifier)) return;
    handled.add(identifier);
    const lessonId = content.data?.lessonId;
    if (typeof lessonId === "string") requestLessonSheet(lessonId);
  }, [response]);
}
