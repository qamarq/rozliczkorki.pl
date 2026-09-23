import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Card,
  Chip,
  MenuGroup,
  MenuRow,
  ScreenBackground,
  ScreenHeader,
  SectionLabel,
  Switch,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  type NotificationChannelKey,
  OVERDUE_OPTIONS,
  UPCOMING_OPTIONS,
  useNotificationPrefs,
} from "@/lib/notification-prefs";
import { requestNotificationPermission } from "@/lib/notifications";
import { colors } from "@/lib/theme";
import { openExactAlarmSettings, useExactAlarmsAllowed } from "@/modules/exact-alarms";
import { openLiveUpdateSettings, useLiveUpdatesAllowed } from "@/modules/lesson-live";
import { HeaderScrollView } from "@/components/scroll-edge-blur";

export default function NotificationSettingsScreen() {
  const { prefs, update } = useNotificationPrefs();
  const exactAlarmsAllowed = useExactAlarmsAllowed();
  const liveUpdatesAllowed = useLiveUpdatesAllowed();

  async function onToggleChannel(key: NotificationChannelKey, enabled: boolean) {
    if (enabled && !(await requestNotificationPermission())) {
      alert(
        "Powiadomienia są wyłączone",
        "Zezwól aplikacji na powiadomienia w ustawieniach systemu, żeby włączyć ten rodzaj powiadomień.",
        [
          { text: "Anuluj", style: "cancel" },
          { text: "Otwórz ustawienia", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    update({ channels: { ...prefs.channels, [key]: enabled } });
  }

  return (
    <ScreenBackground header={<ScreenHeader title="Powiadomienia" />}>
      <HeaderScrollView contentContainerStyle={styles.content}>
        <View>
          <SectionLabel>Rodzaje powiadomień</SectionLabel>
          <Card style={{ gap: 16 }}>
            {NOTIFICATION_CHANNEL_OPTIONS.map((opt) => (
              <View key={opt.key} style={{ gap: 8 }}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.prefLabel}>{opt.label}</Text>
                    <Text style={styles.prefHint}>{opt.description}</Text>
                  </View>
                  <Switch
                    value={prefs.channels[opt.key]}
                    onValueChange={(enabled) => onToggleChannel(opt.key, enabled)}
                  />
                </View>

                {opt.key === "upcoming" && prefs.channels.upcoming && (
                  <View style={styles.chipRow}>
                    {UPCOMING_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        active={prefs.upcomingMinutesBefore === option.value}
                        onPress={() => update({ upcomingMinutesBefore: option.value })}
                      />
                    ))}
                  </View>
                )}

                {opt.key === "overdue" && prefs.channels.overdue && (
                  <View style={styles.chipRow}>
                    {OVERDUE_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        active={prefs.overdueDaysAfter === option.value}
                        onPress={() => update({ overdueDaysAfter: option.value })}
                      />
                    ))}
                  </View>
                )}

                {opt.key === "live" && prefs.channels.live && !liveUpdatesAllowed && (
                  <Pressable
                    onPress={() => {
                      if (!openLiveUpdateSettings()) Linking.openSettings();
                    }}
                    style={styles.warningRow}
                  >
                    <Text style={[styles.prefHint, { flex: 1 }]}>
                      Powiadomienia na żywo są zablokowane w systemie. Dotknij, aby
                      zezwolić
                    </Text>
                    <Ionicons name="alert-circle" size={20} color={colors.warning} />
                  </Pressable>
                )}
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionLabel>System</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="alarm-outline"
              label="Przypomnienia na czas"
              description={
                exactAlarmsAllowed
                  ? "Włączone, przypomnienia przychodzą o ustawionej porze"
                  : "Wyłączone, przypomnienia mogą się spóźniać. Dotknij, aby zezwolić"
              }
              trailing={
                <Ionicons
                  name={exactAlarmsAllowed ? "checkmark-circle" : "alert-circle"}
                  size={20}
                  color={exactAlarmsAllowed ? colors.success : colors.warning}
                />
              }
              onPress={() => {
                if (!openExactAlarmSettings()) Linking.openSettings();
              }}
            />
            <MenuRow
              icon="options-outline"
              label="Kategorie powiadomień"
              description="Zarządzaj kategoriami powiadomień w ustawieniach systemowych"
              onPress={() => Linking.openSettings()}
            />
          </MenuGroup>
        </View>
      </HeaderScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  warningRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  prefLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  prefHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
});
