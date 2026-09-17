import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "@/components/ui";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { formatPLN } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { AppRouter } from "@repo/api";
import type { inferRouterClient } from "@trpc/client";

export type LessonRow = Awaited<
  ReturnType<inferRouterClient<AppRouter>["lessons"]["range"]["query"]>
>[number];

export const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "nd"];

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function groupByDay(lessons: LessonRow[]) {
  const map = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const key = dayKey(new Date(lesson.startsAt));
    const list = map.get(key) ?? [];
    list.push(lesson);
    map.set(key, list);
  }
  return map;
}

export function lessonTone(lesson: LessonRow) {
  if (lesson.vacationId) return { fg: colors.textFaint, bg: colors.surface };
  if (lesson.status === "cancelled") return { fg: colors.danger, bg: colors.dangerBg };
  if (lesson.settled) return { fg: colors.success, bg: colors.successBg };
  return { fg: colors.warning, bg: colors.warningBg };
}

export function PeriodNav({
  label,
  onPrev,
  onNext,
  onToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <View style={styles.nav}>
      <Pressable onPress={onPrev} style={styles.navButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.navLabel} numberOfLines={1}>
        {capitalize(label)}
      </Text>
      <Pressable onPress={onNext} style={styles.navButton} hitSlop={8}>
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>
      <Pressable onPress={onToday} style={styles.todayButton}>
        <Text style={styles.todayText}>Dziś</Text>
      </Pressable>
    </View>
  );
}

export function LessonCard({ item, showDate }: { item: LessonRow; showDate?: boolean }) {
  const startsAt = new Date(item.startsAt);
  return (
    <Pressable onPress={() => openLessonSheet(item.id)}>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>
            {showDate ? format(startsAt, "d MMM, ", { locale: pl }) : ""}
            {format(startsAt, "HH:mm")} · {item.student?.name}
            {item.mode === "remote" ? " · online" : ""}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={
                item.vacationId
                  ? "Urlop"
                  : item.status === "cancelled"
                    ? "Odwołane"
                    : item.status === "completed"
                      ? "Odbyły się"
                      : "Zaplanowane"
              }
              tone={
                item.vacationId
                  ? "default"
                  : item.status === "cancelled"
                    ? "danger"
                    : item.status === "completed"
                      ? "success"
                      : "default"
              }
            />
            <Badge
              label={item.settled ? "opłacone" : "nieopłacone"}
              tone={item.settled ? "success" : "warning"}
            />
          </View>
        </View>
        <Text style={styles.price}>{formatPLN(item.price)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  todayButton: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  todayText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  price: { fontSize: 15, fontWeight: "700", color: colors.text },
});
