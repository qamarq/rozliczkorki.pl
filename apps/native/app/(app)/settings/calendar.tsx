import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Chip, ScreenBackground, ScreenHeader } from "@/components/ui";
import { CALENDAR_VIEW_OPTIONS, useDefaultCalendarView } from "@/lib/calendar-prefs";
import { colors } from "@/lib/theme";

export default function CalendarSettingsScreen() {
  const calendarView = useDefaultCalendarView();

  return (
    <ScreenBackground>
      <ScreenHeader title="Kalendarz" />
      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  prefHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
});
