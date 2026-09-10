import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { TRPCProvider } from "@/lib/trpc";
import { colors } from "@/lib/theme";

const ONBOARDING_KEY = "onboarding_complete";

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY).then((v) => setSeen(v === "true"));
  }, []);

  useEffect(() => {
    if (seen === null) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!seen && !inOnboarding) {
      router.replace("/onboarding");
    }
  }, [seen, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <TRPCProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <OnboardingGate />
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
            name="lesson/[id]"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Zajęcia",
              headerStyle: { backgroundColor: colors.bgElevated },
              headerTintColor: colors.text,
            }}
          />
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
      </View>
      <StatusBar style="light" />
    </TRPCProvider>
  );
}
