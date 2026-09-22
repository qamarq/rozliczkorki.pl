import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Link, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { TabHeader } from "@/components/tab-header";
import { ScreenBackground, tabScreenEdges } from "@/components/ui";
import { ListView } from "@/components/calendar/list-view";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import {
  CALENDAR_VIEW_OPTIONS,
  type CalendarView,
  useDefaultCalendarView,
} from "@/lib/calendar-prefs";
import { colors, gradients, radius, tabHeaderTop } from "@/lib/theme";

export default function CalendarScreen() {
  const defaultView = useDefaultCalendarView();
  const [mode, setMode] = useState<CalendarView | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    if (defaultView.loaded) setMode(defaultView.view);
  }, [defaultView.loaded, defaultView.view]);

  const newLessonHref: Href =
    mode === "list"
      ? "/lesson/new"
      : { pathname: "/lesson/new", params: { date: format(selectedDate, "yyyy-MM-dd") } };

  return (
    <ScreenBackground syncStatus edges={tabScreenEdges}>
      <View style={styles.headerBlock}>
        <TabHeader title="Kalendarz" />
        <View style={styles.controls}>
          <View style={styles.segmented}>
            {CALENDAR_VIEW_OPTIONS.map((m) => {
              const active = m.value === mode;
              if (!mode) {
                return (
                  <View key={m.value} style={styles.segment}>
                    <Text style={styles.segmentText}>{m.label}</Text>
                  </View>
                );
              }
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
          {Platform.OS === "ios" && (
            <Link href={newLessonHref} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nowe zajęcia"
                hitSlop={6}
              >
                <LinearGradient
                  colors={gradients.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>
            </Link>
          )}
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
      {Platform.OS !== "ios" && (
        <Link href={newLessonHref} asChild>
          <Pressable style={styles.fabWrap}>
            <LinearGradient colors={gradients.accent} style={styles.fab}>
              <Text style={styles.fabText}>+</Text>
            </LinearGradient>
          </Pressable>
        </Link>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: tabHeaderTop,
    marginBottom: 12,
    gap: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  segmented: {
    alignSelf: "flex-start",
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
    bottom: 12,
    borderRadius: 16,
    shadowColor: colors.accentTo,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "white", fontSize: 28, lineHeight: 30 },
});
