import { Redirect, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { authClient, useSession } from "@/lib/auth-client";
import { subscribePendingLesson, takePendingLesson } from "@/lib/pending-lesson";
import { useLocalNotificationsSync } from "@/lib/use-local-notifications";
import { usePushRegistration } from "@/lib/use-push-registration";
import { colors } from "@/lib/theme";
import { signOutCompletely } from "@/lib/trpc";

export default function AppLayout() {
  const { data: session, isPending } = useSession();
  const signedIn = !!session?.user;
  usePushRegistration(signedIn);
  useLocalNotificationsSync(signedIn);

  const sessionChecked = useRef(false);
  useEffect(() => {
    if (!signedIn || sessionChecked.current) return;
    sessionChecked.current = true;
    void (async () => {
      const result = await authClient
        .getSession({ query: { disableCookieCache: true } })
        .catch(() => undefined);
      if (result && !result.data?.user) await signOutCompletely();
    })();
  }, [signedIn]);

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
      <Stack.Screen name="stats" />
      <Stack.Screen name="school/[id]" />
    </Stack>
  );
}
