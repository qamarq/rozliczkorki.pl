import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { BlurTargetView } from "expo-blur";
import { View } from "react-native";
import { AnalyticsIdentity } from "@/lib/analytics-identity";
import { AlertDialogHost } from "@/components/alert-dialog-host";
import { SheetHost } from "@/components/sheet-host";
import { TRPCProvider } from "@/lib/trpc";
import { colors } from "@/lib/theme";
import { useNotificationTaps } from "@/lib/use-notification-taps";

const ONBOARDING_KEY = "onboarding_complete";

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inOnboarding = segments[0] === "onboarding";
    if (inOnboarding) return;
    SecureStore.getItemAsync(ONBOARDING_KEY).then((v) => {
      if (v !== "true") {
        router.replace("/onboarding");
      }
    });
  }, [segments]);

  return null;
}

export default function RootLayout() {
  const blurTarget = useRef<View>(null);
  useNotificationTaps();

  return (
    <TRPCProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
          <OnboardingGate />
          <AnalyticsIdentity />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen
              name="lesson/new"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "Nowe zajęcia",
                headerStyle: { backgroundColor: colors.bgElevated },
                headerTintColor: colors.text,
              }}
            />
          </Stack>
        </BlurTargetView>
        <SheetHost blurTarget={blurTarget} />
        <AlertDialogHost blurTarget={blurTarget} />
      </View>
      <StatusBar style="light" />
    </TRPCProvider>
  );
}
