import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Card,
  MenuGroup,
  MenuRow,
  OutlineButton,
  ScreenBackground,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui";
import { resetAnalytics } from "@/lib/analytics";
import { authClient, useSession } from "@/lib/auth-client";
import { CALENDAR_VIEW_OPTIONS, useDefaultCalendarView } from "@/lib/calendar-prefs";
import { DELETE_ACCOUNT_URL, PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { colors } from "@/lib/theme";
import { clearOfflineCache } from "@/lib/trpc";
import { syncLiveLessons } from "@/modules/lesson-live";

const externalIcon = <Ionicons name="open-outline" size={16} color={colors.textFaint} />;

export default function SettingsScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const calendarView = useDefaultCalendarView();
  const calendarViewLabel = CALENDAR_VIEW_OPTIONS.find(
    (opt) => opt.value === calendarView.view,
  )?.label;

  async function onSignOut() {
    await authClient.signOut();
    resetAnalytics();
    syncLiveLessons([]);
    await clearOfflineCache();
  }

  return (
    <ScreenBackground syncStatus>
      <ScreenHeader title="Ustawienia" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          {session?.user?.image ? (
            <Image source={{ uri: session.user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{session?.user?.name}</Text>
            <Text style={styles.profileEmail}>{session?.user?.email}</Text>
          </View>
        </Card>

        <View>
          <SectionLabel>Aplikacja</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="calendar-outline"
              label="Kalendarz"
              description={
                calendarViewLabel ? `Domyślny widok: ${calendarViewLabel}` : undefined
              }
              onPress={() => router.push("/settings/calendar")}
            />
            <MenuRow
              icon="notifications-outline"
              label="Powiadomienia"
              description="Przypomnienia o zajęciach i płatnościach"
              onPress={() => router.push("/settings/notifications")}
            />
          </MenuGroup>
        </View>

        <View>
          <SectionLabel>Konto</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="shield-checkmark-outline"
              label="Bezpieczeństwo"
              description="Hasło i aktywne sesje"
              onPress={() => router.push("/settings/security")}
            />
            <MenuRow
              icon="log-out-outline"
              label="Wyloguj się"
              tone="danger"
              trailing={null}
              onPress={onSignOut}
            />
          </MenuGroup>
        </View>

        <View>
          <SectionLabel>Informacje</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="lock-closed-outline"
              label="Polityka prywatności"
              trailing={externalIcon}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
            <MenuRow
              icon="document-text-outline"
              label="Regulamin"
              trailing={externalIcon}
              onPress={() => Linking.openURL(TERMS_URL)}
            />
            <MenuRow
              icon="trash-outline"
              label="Zasady usuwania konta"
              trailing={externalIcon}
              onPress={() => Linking.openURL(DELETE_ACCOUNT_URL)}
            />
          </MenuGroup>
        </View>

        <OutlineButton
          label="Usuń konto"
          tone="danger"
          onPress={() => router.push("/settings/delete-account")}
        />

        <Text style={styles.version}>
          RozliczKorki {Constants.expoConfig?.version ?? ""}
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: colors.accentTo,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  profileEmail: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  version: { color: colors.textFaint, fontSize: 12, textAlign: "center" },
});
