import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/lib/auth-client";
import { colors, gradients, radius } from "@/lib/theme";

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

export function TabHeader({ title, style }: { title: string; style?: object }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <ProfileAvatarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { flex: 1, fontSize: 24, fontWeight: "800", color: colors.text },
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
