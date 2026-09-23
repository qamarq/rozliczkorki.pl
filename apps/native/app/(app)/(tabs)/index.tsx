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
import { WeekHeader, WeekView } from "@/components/calendar/week-view";
import {
  CALENDAR_VIEW_OPTIONS,
  type CalendarView,
  useDefaultCalendarView,
} from "@/lib/calendar-prefs";
import { setNewLessonHref } from "@/lib/new-lesson";
import { colors, gradients, radius } from "@/lib/theme";

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

  useEffect(() => {
    setNewLessonHref(newLessonHref);
  }, [mode, selectedDate.getTime()]);

  return (
    <ScreenBackground
      syncStatus
      edges={tabScreenEdges}
      header={
        <>
          <TabHeader title="Kalendarz">
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
          </TabHeader>
          {mode === "week" && (
            <WeekHeader selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          )}
        </>
      }
    >
      <View style={{ flex: 1 }}>
        {mode === "month" && (
          <MonthView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        )}
        {mode === "week" && <WeekView selectedDate={selectedDate} />}
        {mode === "list" && <ListView />}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
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
});
