import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { trpc } from "@/lib/trpc";
import { colors, radius } from "@/lib/theme";
import {
  capitalize,
  dayKey,
  groupByDay,
  LessonCard,
  lessonTone,
  PeriodNav,
  WEEKDAYS,
} from "./shared";
import { HeaderScrollView } from "@/components/scroll-edge-blur";

export function MonthView({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(selectedDate));
  const [refreshing, setRefreshing] = useState(false);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart.getTime(), gridEnd.getTime()],
  );

  const { data: lessons = [], refetch } = trpc.lessons.range.useQuery({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });
  const byDay = useMemo(() => groupByDay(lessons), [lessons]);
  const selectedLessons = byDay.get(dayKey(selectedDate)) ?? [];

  function goToMonth(next: Date) {
    setMonth(startOfMonth(next));
    onSelectDate(isSameMonth(next, new Date()) ? new Date() : startOfMonth(next));
  }

  return (
    <HeaderScrollView
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
      <PeriodNav
        label={format(month, "LLLL yyyy", { locale: pl })}
        onPrev={() => goToMonth(subMonths(month, 1))}
        onNext={() => goToMonth(addMonths(month, 1))}
        onToday={() => goToMonth(new Date())}
      />

      <View style={styles.grid}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.days}>
          {days.map((day) => {
            const dayLessons = byDay.get(dayKey(day)) ?? [];
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);
            const outside = !isSameMonth(day, month);
            return (
              <Pressable
                key={dayKey(day)}
                style={styles.cell}
                onPress={() => onSelectDate(day)}
              >
                <View
                  style={[
                    styles.dayInner,
                    selected && styles.daySelected,
                    today && !selected && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      outside && { color: colors.textFaint },
                      (selected || today) && { color: colors.text, fontWeight: "800" },
                    ]}
                  >
                    {format(day, "d")}
                  </Text>
                  <View style={styles.dots}>
                    {dayLessons.slice(0, 3).map((l) => (
                      <View
                        key={l.id}
                        style={[styles.dot, { backgroundColor: lessonTone(l).fg }]}
                      />
                    ))}
                  </View>
                  {dayLessons.length > 3 && (
                    <Text style={styles.more}>+{dayLessons.length - 3}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionHeader}>
        {capitalize(format(selectedDate, "EEEE, d MMMM", { locale: pl }))}
      </Text>
      <View style={{ paddingHorizontal: 16 }}>
        {selectedLessons.length === 0 ? (
          <Text style={styles.empty}>Brak zajęć tego dnia</Text>
        ) : (
          selectedLessons.map((item) => <LessonCard key={item.id} item={item} />)
        )}
      </View>
    </HeaderScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.textFaint,
    textTransform: "uppercase",
  },
  days: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.9, padding: 2 },
  dayInner: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: 6,
  },
  daySelected: { backgroundColor: colors.accentTo, borderColor: colors.accentTo },
  dayToday: { borderColor: colors.accentFrom },
  dayNumber: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  dots: { flexDirection: "row", gap: 3, marginTop: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  more: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textFaint,
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  empty: { color: colors.textFaint, textAlign: "center", marginTop: 16 },
});
