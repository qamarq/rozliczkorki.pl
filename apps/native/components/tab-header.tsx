import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/lib/auth-client";
import { colors, gradients, radius, tabHeaderTop } from "@/lib/theme";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ProfileAvatarButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <Pressable
      onPress={() => router.push("/settings")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Ustawienia"
    >
      {user?.image ? (
        <Image source={{ uri: user.image }} style={styles.avatar} />
      ) : (
        <LinearGradient colors={gradients.accent} style={styles.avatar}>
          <Text style={styles.initials}>{initials(user?.name)}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

function StatsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/stats")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Statystyki"
      style={styles.iconButton}
    >
      <Ionicons name="stats-chart-outline" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function TabHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <StatsButton />
        <ProfileAvatarButton />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 20, paddingTop: tabHeaderTop, paddingBottom: 12, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: { flex: 1, fontSize: 24, fontWeight: "800", color: colors.text },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
