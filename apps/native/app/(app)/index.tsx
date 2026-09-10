import { format, startOfDay, startOfToday } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, ScreenBackground } from "@/components/ui";
import { openLessonSheet } from "@/components/lesson-details-sheet";
import { RefreshableList } from "@/components/refreshable-list";
import { formatPLN } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { colors, gradients, radius } from "@/lib/theme";

export default function CalendarScreen() {
  const from = startOfToday();
  const to = new Date(from.getTime() + 45 * 24 * 60 * 60 * 1000);

  const {
    data: lessons = [],
    refetch,
    isLoading,
  } = trpc.lessons.range.useQuery({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const sections = Object.values(
    lessons.reduce<Record<string, { title: string; data: typeof lessons }>>(
      (acc, lesson) => {
        const key = format(startOfDay(new Date(lesson.startsAt)), "yyyy-MM-dd");
        if (!acc[key]) {
          acc[key] = {
            title: format(new Date(lesson.startsAt), "EEEE, d MMMM", { locale: pl }),
            data: [],
          };
        }
        acc[key].data.push(lesson);
        return acc;
      },
      {},
    ),
  );

  return (
    <ScreenBackground>
      <Text style={styles.header}>Kalendarz</Text>
      <View style={{ flex: 1 }}>
        <RefreshableList onRefresh={refetch}>
          {sections.length === 0 && !isLoading ? (
            <Text key="empty" style={styles.empty}>
              Brak zaplanowanych zajęć
            </Text>
          ) : (
            sections.flatMap((section) => [
              <Text key={`h-${section.title}`} style={styles.sectionHeader}>
                {section.title}
              </Text>,
              ...section.data.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.rowWrap}
                  onPress={() => openLessonSheet(item.id)}
                >
                  <Card style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>
                        {format(new Date(item.startsAt), "HH:mm")} · {item.student?.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        <Badge
                          label={
                            item.status === "cancelled"
                              ? "Odwołane"
                              : item.status === "completed"
                                ? "Odbyły się"
                                : "Zaplanowane"
                          }
                          tone={
                            item.status === "cancelled"
                              ? "danger"
                              : item.status === "completed"
                                ? "success"
                                : "default"
                          }
                        />
                        <Badge
                          label={item.paid ? "opłacone" : "nieopłacone"}
                          tone={item.paid ? "success" : "warning"}
                        />
                      </View>
                    </View>
                    <Text style={styles.price}>{formatPLN(item.price)}</Text>
                  </Card>
                </Pressable>
              )),
            ])
          )}
          <View key="bottom-spacer" style={{ height: 96 }} />
        </RefreshableList>
      </View>
      <Link href="/lesson/new" asChild>
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
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textFaint,
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: "capitalize",
  },
  rowWrap: { paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  price: { fontSize: 15, fontWeight: "700", color: colors.text },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 40 },
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
