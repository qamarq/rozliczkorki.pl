import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Kalendarz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Uczniowie",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Statystyki",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ustawienia",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
