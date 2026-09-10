import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TRPCProvider } from "@/lib/trpc";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
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
      <StatusBar style="light" />
    </TRPCProvider>
  );
}
