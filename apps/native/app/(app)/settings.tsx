import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Card,
  Chip,
  GradientButton,
  Input,
  OutlineButton,
  ScreenBackground,
  SectionLabel,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient, useSession } from "@/lib/auth-client";
import { CALENDAR_VIEW_OPTIONS, useDefaultCalendarView } from "@/lib/calendar-prefs";
import { DELETE_ACCOUNT_URL, PRIVACY_URL, TERMS_URL, WEB_URL } from "@/lib/legal";
import {
  OVERDUE_OPTIONS,
  UPCOMING_OPTIONS,
  useNotificationPrefs,
} from "@/lib/notification-prefs";
import { colors } from "@/lib/theme";
import { openExactAlarmSettings, useExactAlarmsAllowed } from "@/modules/exact-alarms";

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
  const [deleting, setDeleting] = useState(false);
  const { prefs, update } = useNotificationPrefs();
  const calendarView = useDefaultCalendarView();
  const exactAlarmsAllowed = useExactAlarmsAllowed();

  async function loadSessions() {
    const { data } = await authClient.$fetch<SessionRow[]>("/list-sessions");
    if (data) setSessions(data);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function onChangePassword() {
    if (!currentPassword || newPassword.length < 8) {
      alert("Hasło musi mieć min. 8 znaków");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.$fetch("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
    setSavingPassword(false);
    if (error) {
      alert("Błąd", error.message ?? "Nie udało się zmienić hasła");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    alert("Zapisano", "Hasło zostało zmienione");
    loadSessions();
  }

  function onDeleteAccount() {
    alert(
      "Usunąć konto?",
      "Wyślemy link potwierdzający na Twój adres e-mail. Po kliknięciu w niego konto i wszystkie dane (uczniowie, zajęcia, stawki) znikną bezpowrotnie.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyślij link",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await authClient.deleteUser({
              callbackURL: `${WEB_URL}/`,
            });
            setDeleting(false);
            if (error) {
              alert("Błąd", error.message ?? "Nie udało się rozpocząć usuwania konta");
              return;
            }
            alert(
              "Sprawdź skrzynkę",
              "Wysłaliśmy link potwierdzający usunięcie konta na Twój adres e-mail.",
            );
          },
        },
      ],
    );
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

        <SectionLabel>Kalendarz</SectionLabel>
        <Card style={{ gap: 8 }}>
          <Text style={styles.prefLabel}>Domyślny widok</Text>
          <Text style={styles.prefHint}>
            Który widok pokazywać po otwarciu kalendarza.
          </Text>
          <View style={styles.chipRow}>
            {CALENDAR_VIEW_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={calendarView.view === opt.value}
                onPress={() => calendarView.update(opt.value)}
              />
            ))}
          </View>
        </Card>

        <SectionLabel>Powiadomienia</SectionLabel>
        <Card style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={styles.prefLabel}>Przypomnienie przed zajęciami</Text>
            <Text style={styles.prefHint}>
              Ile wcześniej powiadomić o zaplanowanych zajęciach.
            </Text>
            <View style={styles.chipRow}>
              {UPCOMING_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={prefs.upcomingMinutesBefore === opt.value}
                  onPress={() => update({ upcomingMinutesBefore: opt.value })}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.prefLabel}>Przypomnienie o zaległej płatności</Text>
            <Text style={styles.prefHint}>
              Ile po odbytych zajęciach przypomnieć, jeśli wciąż nie są opłacone.
            </Text>
            <View style={styles.chipRow}>
              {OVERDUE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={prefs.overdueDaysAfter === opt.value}
                  onPress={() => update({ overdueDaysAfter: opt.value })}
                />
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (!openExactAlarmSettings()) Linking.openSettings();
            }}
            style={styles.legalRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.legalText}>Przypomnienia na czas</Text>
              <Text style={styles.sessionDate}>
                {exactAlarmsAllowed
                  ? "Włączone — przypomnienia przychodzą o ustawionej porze"
                  : "Wyłączone — przypomnienia mogą się spóźniać. Dotknij, aby zezwolić"}
              </Text>
            </View>
            <Ionicons
              name={exactAlarmsAllowed ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={exactAlarmsAllowed ? colors.success : colors.warning}
            />
          </Pressable>

          <Pressable onPress={() => Linking.openSettings()} style={styles.legalRow}>
            <View>
              <Text style={styles.legalText}>
                Nadchodzące zajęcia i zaległe płatności
              </Text>
              <Text style={styles.sessionDate}>
                Zarządzaj kategoriami powiadomień w ustawieniach systemowych
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
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

        <SectionLabel>Informacje prawne</SectionLabel>
        <Card style={{ gap: 4 }}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.legalRow}>
            <Text style={styles.legalText}>Polityka prywatności</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.legalRow}>
            <Text style={styles.legalText}>Regulamin</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(DELETE_ACCOUNT_URL)}
            style={styles.legalRow}
          >
            <Text style={styles.legalText}>Zasady usuwania konta</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </Pressable>
        </Card>

        <OutlineButton
          label="Wyloguj się"
          tone="danger"
          onPress={() => authClient.signOut()}
        />

        <SectionLabel>Usuwanie konta</SectionLabel>
        <Card style={{ gap: 12 }}>
          <Text style={styles.prefHint}>
            Konto i wszystkie dane znikają bezpowrotnie. Dla bezpieczeństwa potwierdzasz
            to linkiem, który wyślemy na Twój e-mail.
          </Text>
          <OutlineButton
            label={deleting ? "Wysyłanie…" : "Usuń konto"}
            tone="danger"
            onPress={onDeleteAccount}
            disabled={deleting}
          />
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: colors.accentTo,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  prefHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  legalText: { color: colors.text, fontSize: 14, fontWeight: "600" },
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
