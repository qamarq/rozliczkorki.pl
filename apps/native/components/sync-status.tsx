import { Ionicons } from "@expo/vector-icons";
import { onlineManager } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";
import { useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";
import { queryClient } from "@/lib/trpc";

function useIsOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

function latestDataUpdate() {
  let latest = 0;
  for (const query of queryClient.getQueryCache().getAll()) {
    latest = Math.max(latest, query.state.dataUpdatedAt);
  }
  return latest;
}

function useLastSyncedAt() {
  return useSyncExternalStore(
    (onChange) => queryClient.getQueryCache().subscribe(onChange),
    latestDataUpdate,
  );
}

function formatSyncTime(timestamp: number) {
  const date = new Date(timestamp);
  const time = format(date, "HH:mm");
  if (isToday(date)) return `dziś, ${time}`;
  if (isYesterday(date)) return `wczoraj, ${time}`;
  return format(date, "d MMM, HH:mm", { locale: pl });
}

export function OfflineBanner() {
  const online = useIsOnline();
  const lastSyncedAt = useLastSyncedAt();
  if (online) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerText}>Jesteś offline, dane mogą być nieaktualne</Text>
        {lastSyncedAt > 0 && (
          <Text style={styles.bannerHint}>
            Ostatnia aktualizacja: {formatSyncTime(lastSyncedAt)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warningBg,
  },
  bannerText: { color: colors.warning, fontSize: 13, fontWeight: "600" },
  bannerHint: { color: colors.warning, fontSize: 11, opacity: 0.8, marginTop: 2 },
});
