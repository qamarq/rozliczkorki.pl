import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "@/components/ui";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { colors, radius } from "@/lib/theme";
import type { AppRouter } from "@repo/api";
import type { inferRouterClient } from "@trpc/client";
import { LESSON_TONE_LABELS, type LessonTone, formatPLN } from "@repo/shared";

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

export const TONE_COLORS: Record<LessonTone, { fg: string; bg: string }> = {
  upcoming: { fg: colors.textMuted, bg: colors.surface },
  prepaid: { fg: colors.success, bg: colors.surface },
  paid: { fg: colors.success, bg: colors.successBg },
  awaiting: { fg: colors.warning, bg: colors.warningBg },
  overdue: { fg: colors.warning, bg: colors.warningBg },
  cancelled: { fg: colors.textFaint, bg: colors.surface },
  cancelledPaid: { fg: colors.textFaint, bg: colors.surface },
};

export const TONE_ICONS: Record<LessonTone, keyof typeof Ionicons.glyphMap> = {
  upcoming: "time-outline",
  prepaid: "wallet-outline",
  paid: "checkmark-circle-outline",
  awaiting: "hourglass-outline",
  overdue: "alert-circle",
  cancelled: "ban-outline",
  cancelledPaid: "ban-outline",
};

export function lessonTone(lesson: LessonRow) {
  return TONE_COLORS[lesson.tone];
}

export function toneRing(tone: LessonTone) {
  if (tone === "overdue") return colors.danger;
  if (tone === "prepaid" || tone === "cancelledPaid") return colors.success;
  return null;
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
  const tone = TONE_COLORS[item.tone];
  const ring = toneRing(item.tone);
  const struck = item.tone.startsWith("cancelled");
  return (
    <Pressable onPress={() => openLessonSheet(item.id)}>
      <Card
        style={[
          styles.row,
          { backgroundColor: tone.bg },
          ring ? { borderColor: ring, borderWidth: 1.5 } : null,
        ]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.timeRow}>
            <Text
              style={[styles.time, { color: tone.fg }, struck ? styles.struck : null]}
            >
              {showDate ? format(startsAt, "d MMM, ", { locale: pl }) : ""}
              {format(startsAt, "HH:mm")}
            </Text>
            <Ionicons name={TONE_ICONS[item.tone]} size={13} color={tone.fg} />
          </View>
          <Text
            style={[styles.rowTitle, struck ? styles.struck : null]}
            numberOfLines={1}
          >
            {item.student?.name}
            {item.mode === "remote" ? " · online" : ""}
          </Text>
          <Text style={[styles.meta, { color: tone.fg }]} numberOfLines={1}>
            {formatPLN(item.price)} · {LESSON_TONE_LABELS[item.tone]}
          </Text>
        </View>
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
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  time: { fontSize: 13, fontWeight: "700" },
  meta: { fontSize: 12, fontWeight: "600" },
  struck: { textDecorationLine: "line-through", color: colors.textFaint },
});
