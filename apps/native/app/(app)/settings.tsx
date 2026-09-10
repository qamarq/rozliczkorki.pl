import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Card,
  GradientButton,
  Input,
  OutlineButton,
  ScreenBackground,
  SectionLabel,
} from "@/components/ui";
import { authClient, useSession } from "@/lib/auth-client";
import { colors } from "@/lib/theme";

type SessionRow = {
  id: string;
  token: string;
  createdAt: string;
  userAgent?: string | null;
};

export default function SettingsScreen() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function loadSessions() {
    const { data } = await authClient.$fetch<SessionRow[]>("/list-sessions");
    if (data) setSessions(data);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function onChangePassword() {
    if (!currentPassword || newPassword.length < 8) {
      Alert.alert("Hasło musi mieć min. 8 znaków");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.$fetch("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
    setSavingPassword(false);
    if (error) {
      Alert.alert("Błąd", error.message ?? "Nie udało się zmienić hasła");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    Alert.alert("Zapisano", "Hasło zostało zmienione");
    loadSessions();
  }

  async function onRevoke(token: string) {
    await authClient.$fetch("/revoke-session", { method: "POST", body: { token } });
    loadSessions();
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ustawienia</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{session?.user?.name}</Text>
            <Text style={styles.profileEmail}>{session?.user?.email}</Text>
          </View>
        </Card>

        <SectionLabel>Zmiana hasła</SectionLabel>
        <Card style={{ gap: 12 }}>
          <Input
            label="Obecne hasło"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Input
            label="Nowe hasło"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <GradientButton
            label="Zmień hasło"
            onPress={onChangePassword}
            loading={savingPassword}
          />
        </Card>

        <SectionLabel>Aktywne sesje</SectionLabel>
        <Card style={{ gap: 10 }}>
          {sessions.length === 0 && (
            <Text style={styles.emptyText}>Brak innych aktywnych sesji</Text>
          )}
          {sessions.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionDevice} numberOfLines={1}>
                  {s.userAgent ?? "Nieznane urządzenie"}
                </Text>
                <Text style={styles.sessionDate}>
                  {formatDistanceToNow(new Date(s.createdAt), {
                    addSuffix: true,
                    locale: pl,
                  })}
                </Text>
              </View>
              <Pressable onPress={() => onRevoke(s.token)} hitSlop={10}>
                <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
              </Pressable>
            </View>
          ))}
        </Card>

        <OutlineButton
          label="Wyloguj się"
          tone="danger"
          onPress={() => authClient.signOut()}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentTo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  profileEmail: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  emptyText: { color: colors.textFaint, fontSize: 13 },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  sessionDevice: { color: colors.text, fontSize: 14, fontWeight: "600" },
  sessionDate: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
});
