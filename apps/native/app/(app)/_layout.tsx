import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { useSession } from "@/lib/auth-client";
import { subscribePendingLesson, takePendingLesson } from "@/lib/pending-lesson";
import { useLocalNotificationsSync } from "@/lib/use-local-notifications";
import { usePushRegistration } from "@/lib/use-push-registration";
import { colors } from "@/lib/theme";

export default function AppLayout() {
  const { data: session, isPending } = useSession();
  const signedIn = !!session?.user;
  usePushRegistration(signedIn);
  useLocalNotificationsSync(signedIn);

  useEffect(() => {
    if (!signedIn) return;
    const openPending = () => {
      const lessonId = takePendingLesson();
      if (lessonId) openLessonSheet(lessonId);
    };
    openPending();
    return subscribePendingLesson(openPending);
  }, [signedIn]);

  if (isPending) return null;
  if (!signedIn) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
