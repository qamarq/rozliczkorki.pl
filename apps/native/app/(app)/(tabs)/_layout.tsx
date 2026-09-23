import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/floating-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Kalendarz",
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Uczniowie",
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: "Szkółki",
        }}
      />
      <Tabs.Screen
        name="vacations"
        options={{
          title: "Urlopy",
        }}
      />
    </Tabs>
  );
}
