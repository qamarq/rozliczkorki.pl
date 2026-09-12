import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { trpc } from "@/lib/trpc";
import { colors, radius } from "@/lib/theme";
import { dayKey, groupByDay, lessonTone, PeriodNav, WEEKDAYS } from "./shared";

const HOUR_HEIGHT = 56;
const GUTTER = 38;
const DEFAULT_START = 7;
const DEFAULT_END = 22;

export function WeekView({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 }),
  );
  const [refreshing, setRefreshing] = useState(false);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart.getTime()],
  );

  const {
    data: lessons = [],
    refetch,
    isLoading,
  } = trpc.lessons.range.useQuery({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });
  const byDay = useMemo(() => groupByDay(lessons), [lessons]);

  const { startHour, endHour } = useMemo(() => {
    let start = DEFAULT_START;
    let end = DEFAULT_END;
    for (const l of lessons) {
      const s = new Date(l.startsAt);
      start = Math.min(start, s.getHours());
      end = Math.max(
        end,
        Math.ceil(s.getHours() + (s.getMinutes() + l.durationMinutes) / 60),
      );
    }
    return { startHour: start, endHour: Math.min(end, 24) };
  }, [lessons]);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  function goToWeek(next: Date) {
    const start = startOfWeek(next, { weekStartsOn: 1 });
    setWeekStart(start);
    const today = new Date();
    onSelectDate(
      today >= start && today <= endOfWeek(start, { weekStartsOn: 1 }) ? today : start,
    );
  }

  const label = isSameMonth(weekStart, weekEnd)
    ? `${format(weekStart, "d")}–${format(weekEnd, "d LLL yyyy", { locale: pl })}`
    : `${format(weekStart, "d LLL", { locale: pl })} – ${format(weekEnd, "d LLL yyyy", { locale: pl })}`;

  const now = new Date();
  const nowOffset = (now.getHours() - startHour + now.getMinutes() / 60) * HOUR_HEIGHT;

  const scrollRef = useRef<ScrollView>(null);
  const scrolledFor = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading || scrolledFor.current === weekStart.getTime()) return;
    scrolledFor.current = weekStart.getTime();
    const firstHour = lessons.length
      ? Math.min(...lessons.map((l) => new Date(l.startsAt).getHours()))
      : null;
    const inThisWeek = now >= weekStart && now <= weekEnd;
    const target = inThisWeek
      ? Math.min(firstHour ?? now.getHours(), now.getHours() - 1)
      : (firstHour ?? DEFAULT_START);
    scrollRef.current?.scrollTo({
      y: Math.max(0, (target - startHour) * HOUR_HEIGHT - 12),
      animated: false,
    });
  }, [isLoading, weekStart.getTime(), lessons]);

  return (
    <View style={{ flex: 1 }}>
      <PeriodNav
        label={label}
        onPrev={() => goToWeek(subWeeks(weekStart, 1))}
        onNext={() => goToWeek(addWeeks(weekStart, 1))}
        onToday={() => goToWeek(new Date())}
      />
      <View style={styles.headerRow}>
        <View style={{ width: GUTTER }} />
        {days.map((day, i) => {
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          return (
            <Pressable
              key={dayKey(day)}
              style={styles.headerCell}
              onPress={() => onSelectDate(day)}
            >
              <Text style={[styles.headerWeekday, today && { color: "#a78bfa" }]}>
                {WEEKDAYS[i]}
              </Text>
              <View
                style={[
                  styles.headerDay,
                  selected && { backgroundColor: colors.accentTo },
                  today &&
                    !selected && { borderWidth: 1, borderColor: colors.accentFrom },
                ]}
              >
                <Text
                  style={[
                    styles.headerDayText,
                    (selected || today) && { color: colors.text },
                  ]}
                >
                  {format(day, "d")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accentTo}
            colors={[colors.accentTo]}
            progressBackgroundColor={colors.surface}
            onRefresh={async () => {
              setRefreshing(true);
              await refetch();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={[styles.body, { height: hours.length * HOUR_HEIGHT }]}>
          {hours.map((h, i) => (
            <View key={h} style={[styles.hourRow, { top: i * HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>{`${h}:00`}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          <View style={[styles.columns, { left: GUTTER }]}>
            {days.map((day) => {
              const dayLessons = byDay.get(dayKey(day)) ?? [];
              const today = isToday(day);
              return (
                <View
                  key={dayKey(day)}
                  style={[
                    styles.column,
                    today && { backgroundColor: "rgba(99,102,241,0.06)" },
                  ]}
                >
                  {dayLessons.map((lesson) => {
                    const s = new Date(lesson.startsAt);
                    const top =
                      (s.getHours() - startHour + s.getMinutes() / 60) * HOUR_HEIGHT;
                    const height = Math.max(
                      (lesson.durationMinutes / 60) * HOUR_HEIGHT,
                      22,
                    );
                    const tone = lessonTone(lesson);
                    const cancelled = lesson.status === "cancelled";
                    return (
                      <Pressable
                        key={lesson.id}
                        onPress={() => openLessonSheet(lesson.id)}
                        style={[
                          styles.block,
                          {
                            top,
                            height,
                            backgroundColor: tone.bg,
                            borderLeftColor: tone.fg,
                          },
                        ]}
                      >
                        <Text style={styles.blockTime} numberOfLines={1}>
                          {format(s, "HH:mm")}
                        </Text>
                        <Text
                          style={[
                            styles.blockName,
                            cancelled && {
                              textDecorationLine: "line-through",
                              color: colors.textMuted,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {lesson.student?.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {today && nowOffset >= 0 && nowOffset <= hours.length * HOUR_HEIGHT && (
                    <View style={[styles.nowLine, { top: nowOffset }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: { flex: 1, alignItems: "center", gap: 4 },
  headerWeekday: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textFaint,
    textTransform: "uppercase",
  },
  headerDay: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerDayText: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
  body: { marginHorizontal: 4, marginTop: 8 },
  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hourLabel: {
    width: GUTTER,
    fontSize: 10,
    color: colors.textFaint,
    marginTop: -6,
    textAlign: "right",
    paddingRight: 6,
  },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.borderSubtle },
  columns: { position: "absolute", top: 0, bottom: 0, right: 0, flexDirection: "row" },
  column: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
  },
  block: {
    position: "absolute",
    left: 1,
    right: 1,
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 3,
    paddingVertical: 2,
    overflow: "hidden",
  },
  blockTime: { fontSize: 10, fontWeight: "700", color: colors.text },
  blockName: { fontSize: 10, color: colors.text, lineHeight: 13 },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.danger,
  },
});
