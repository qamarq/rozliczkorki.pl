import { format } from "date-fns";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenBackground } from "@/components/ui";
import { ListView } from "@/components/calendar/list-view";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import {
  CALENDAR_VIEW_OPTIONS,
  type CalendarView,
  useDefaultCalendarView,
} from "@/lib/calendar-prefs";
import { colors, gradients, radius } from "@/lib/theme";

export default function CalendarScreen() {
  const defaultView = useDefaultCalendarView();
  const [mode, setMode] = useState<CalendarView | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    if (defaultView.loaded) setMode(defaultView.view);
  }, [defaultView.loaded, defaultView.view]);

  if (!mode) return <ScreenBackground>{null}</ScreenBackground>;

  return (
    <ScreenBackground syncStatus>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Kalendarz</Text>
        <View style={styles.segmented}>
          {CALENDAR_VIEW_OPTIONS.map((m) => {
            const active = m.value === mode;
            return (
              <Pressable key={m.value} onPress={() => setMode(m.value)}>
                {active ? (
                  <LinearGradient
                    colors={gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.segment}
                  >
                    <Text style={styles.segmentTextActive}>{m.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.segment}>
                    <Text style={styles.segmentText}>{m.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {mode === "month" && (
          <MonthView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )}
        {mode === "week" && (
          <WeekView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )}
        {mode === "list" && <ListView />}
      </View>
      <Link
        href={
          mode === "list"
            ? "/lesson/new"
            : {
                pathname: "/lesson/new",
                params: { date: format(selectedDate, "yyyy-MM-dd") },
              }
        }
        asChild
      >
        <Pressable style={styles.fabWrap}>
          <LinearGradient colors={gradients.accent} style={styles.fab}>
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </Pressable>
      </Link>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    padding: 3,
  },
  segment: {
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  segmentText: { color: colors.textMuted, fontWeight: "600", fontSize: 12 },
  segmentTextActive: { color: "#fff", fontWeight: "700", fontSize: 12 },
  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 24,
    borderRadius: radius.full,
    shadowColor: colors.accentTo,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "white", fontSize: 28, lineHeight: 30 },
});
