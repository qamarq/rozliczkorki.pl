import { requireOptionalNativeModule } from "expo";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

type ExactAlarmsModule = {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): boolean;
};

const native = requireOptionalNativeModule<ExactAlarmsModule>("ExactAlarms");

export function canScheduleExactAlarms() {
  return native ? native.canScheduleExactAlarms() : true;
}

export function openExactAlarmSettings() {
  return native ? native.openExactAlarmSettings() : false;
}

export function useExactAlarmsAllowed() {
  const [allowed, setAllowed] = useState(canScheduleExactAlarms);
  const refresh = useCallback(() => setAllowed(canScheduleExactAlarms()), []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return allowed;
}
