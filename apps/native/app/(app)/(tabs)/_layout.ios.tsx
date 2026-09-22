import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs tintColor="#a78bfa">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Kalendarz</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="students">
        <NativeTabs.Trigger.Label>Uczniowie</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schools">
        <NativeTabs.Trigger.Label>Szkółki</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "graduationcap", selected: "graduationcap.fill" }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vacations">
        <NativeTabs.Trigger.Label>Urlopy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="airplane" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
