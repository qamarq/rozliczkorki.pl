import { Ionicons } from "@expo/vector-icons";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Card,
  Chip,
  MenuGroup,
  MenuRow,
  ScreenBackground,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui";
import {
  OVERDUE_OPTIONS,
  UPCOMING_OPTIONS,
  useNotificationPrefs,
} from "@/lib/notification-prefs";
import { colors } from "@/lib/theme";
import { openExactAlarmSettings, useExactAlarmsAllowed } from "@/modules/exact-alarms";

export default function NotificationSettingsScreen() {
  const { prefs, update } = useNotificationPrefs();
  const exactAlarmsAllowed = useExactAlarmsAllowed();

  return (
    <ScreenBackground>
      <ScreenHeader title="Powiadomienia" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <SectionLabel>Przypomnienia</SectionLabel>
          <Card style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={styles.prefLabel}>Przed zajęciami</Text>
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
              <Text style={styles.prefLabel}>O zaległej płatności</Text>
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
                  ? "Włączone — przypomnienia przychodzą o ustawionej porze"
                  : "Wyłączone — przypomnienia mogą się spóźniać. Dotknij, aby zezwolić"
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
              description="Nadchodzące zajęcia i zaległe płatności w ustawieniach systemowych"
              onPress={() => Linking.openSettings()}
            />
          </MenuGroup>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  prefHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
});
