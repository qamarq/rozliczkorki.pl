import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { useEffect } from "react";
import { Platform } from "react-native";
import { trpc } from "./trpc";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function usePushRegistration(enabled: boolean) {
  const registerToken = trpc.pushTokens.register.useMutation();

  useEffect(() => {
    if (!enabled || !Device.isDevice || isExpoGo) return;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) return;

        const { data: token } = await Notifications.getExpoPushTokenAsync();
        registerToken.mutate({ token, platform: Platform.OS });
      } catch {
        return;
      }
    })();
  }, [enabled]);
}
