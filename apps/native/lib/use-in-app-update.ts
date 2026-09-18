import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  type InstallationResult,
  type StatusUpdateEvent,
} from "sp-react-native-in-app-updates";

export type UpdateState =
  | { kind: "none" }
  | { kind: "available"; storeVersion?: string }
  | { kind: "downloading"; progress: number; downloaded: number; total: number }
  | { kind: "downloaded" }
  | { kind: "installing" }
  | { kind: "failed" };

const DISMISSED_KEY = "rk_update.dismissed_version";

export function useInAppUpdate() {
  const [state, setState] = useState<UpdateState>({ kind: "none" });
  const updates = useRef<SpInAppUpdates | null>(null);
  const storeVersion = useRef<string | undefined>(undefined);

  if (Platform.OS === "android" && !updates.current) {
    updates.current = new SpInAppUpdates(__DEV__);
  }

  const check = useCallback(async () => {
    const client = updates.current;
    const curVersion = Constants.expoConfig?.version;
    if (!client || !curVersion) return;
    try {
      const result = await client.checkNeedsUpdate({ curVersion });
      if (!result.shouldUpdate) return;
      // Sideloaded and debug builds throw instead of resolving, so this is
      // reached only for real Play installs.
      const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      if (dismissed && dismissed === (result.storeVersion ?? "")) return;
      storeVersion.current = result.storeVersion;
      setState({ kind: "available", storeVersion: result.storeVersion });
    } catch {
      // No Play entitlement, offline, or an unsupported install source.
    }
  }, []);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void check();
    });
    return () => sub.remove();
  }, [check]);

  const onStatus = useCallback((event: StatusUpdateEvent) => {
    const total = Number(event.totalBytesToDownload) || 0;
    const downloaded = Number(event.bytesDownloaded) || 0;
    switch (event.status) {
      case IAUInstallStatus.PENDING:
        setState({ kind: "downloading", progress: 0, downloaded: 0, total });
        break;
      case IAUInstallStatus.DOWNLOADING:
        setState({
          kind: "downloading",
          progress: total > 0 ? downloaded / total : 0,
          downloaded,
          total,
        });
        break;
      case IAUInstallStatus.DOWNLOADED:
        setState({ kind: "downloaded" });
        break;
      case IAUInstallStatus.INSTALLING:
        setState({ kind: "installing" });
        break;
      case IAUInstallStatus.FAILED:
        setState({ kind: "failed" });
        break;
      case IAUInstallStatus.CANCELED:
        setState({ kind: "available", storeVersion: storeVersion.current });
        break;
      default:
        break;
    }
  }, []);

  // Declining Play's consent dialog emits no download status, so without this
  // the banner would sit on "downloading" forever.
  const onIntentResult = useCallback((result: InstallationResult) => {
    if (result === IAUInstallStatus.CANCELED) {
      setState({ kind: "available", storeVersion: storeVersion.current });
    }
  }, []);

  useEffect(() => {
    const client = updates.current;
    if (!client) return;
    client.addStatusUpdateListener(onStatus);
    client.addIntentSelectionListener(onIntentResult);
    return () => {
      client.removeStatusUpdateListener(onStatus);
      client.removeIntentSelectionListener(onIntentResult);
    };
  }, [onStatus, onIntentResult]);

  const download = useCallback(async () => {
    const client = updates.current;
    if (!client) return;
    setState({ kind: "downloading", progress: 0, downloaded: 0, total: 0 });
    try {
      await client.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
    } catch {
      setState({ kind: "failed" });
    }
  }, []);

  const install = useCallback(() => {
    const client = updates.current;
    if (!client) return;
    setState({ kind: "installing" });
    client.installUpdate();
  }, []);

  const dismiss = useCallback(() => {
    setState({ kind: "none" });
    void AsyncStorage.setItem(DISMISSED_KEY, storeVersion.current ?? "");
  }, []);

  return { state, download, install, dismiss, retry: download };
}
