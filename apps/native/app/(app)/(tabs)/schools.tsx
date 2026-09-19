import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, OutlineButton, ScreenBackground } from "@/components/ui";
import { RefreshableList } from "@/components/refreshable-list";
import { openSchoolSheet } from "@/components/school-sheet";
import { SkeletonLine, SkeletonList, lineHeights } from "@/components/skeleton";
import { TabHeader } from "@/components/tab-header";
import { formatPayoutSchedule, formatPLN, pluralize } from "@repo/shared";
import { colors, tabHeaderTop } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function SchoolsScreen() {
  const router = useRouter();
  const {
    data: schools = [],
    isLoading,
    refetch,
  } = trpc.schools.list.useQuery({ includeArchived: true });

  const awaitingTotal = schools.reduce((sum, school) => sum + school.awaiting, 0);

  return (
    <ScreenBackground syncStatus>
      <View style={{ flex: 1 }}>
        <RefreshableList onRefresh={refetch}>
          <View key="head" style={styles.head}>
            <TabHeader title="Szkółki" />
            <OutlineButton label="+ Dodaj szkółkę" onPress={() => openSchoolSheet()} />
          </View>

          {isLoading && schools.length === 0 ? (
            <View key="total" style={styles.cardWrap}>
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Do wypłaty ze szkółek</Text>
                <SkeletonLine lineHeight={lineHeights.total} barHeight={20} width={130} />
              </Card>
            </View>
          ) : schools.length > 0 ? (
            <View key="total" style={styles.cardWrap}>
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Do wypłaty ze szkółek</Text>
                <Text style={styles.totalValue}>{formatPLN(awaitingTotal)}</Text>
              </Card>
            </View>
          ) : null}

          {isLoading && schools.length === 0 ? (
            <SkeletonList key="skeleton" count={4} lines={3} badge />
          ) : schools.length === 0 ? (
            <Text key="empty" style={styles.empty}>
              Brak szkółek. Dodaj placówkę, a potem przypisz do niej uczniów.
            </Text>
          ) : (
            schools.map((school) => (
              <Pressable
                key={school.id}
                style={styles.cardWrap}
                onPress={() => router.push(`/school/${school.id}`)}
              >
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{school.name}</Text>
                    {school.awaiting > 0 ? (
                      <Badge label={formatPLN(school.awaiting)} tone="warning" />
                    ) : null}
                  </View>
                  {school.address ? (
                    <Text style={styles.cardSubtitle}>{school.address}</Text>
                  ) : null}
                  <Text style={styles.cardSubtitle}>
                    {formatPayoutSchedule(school.payoutFrequency, school.payoutDay)}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {pluralize(school.studentCount, "uczeń", "uczniów", "uczniów")} ·{" "}
                    {pluralize(school.lessonCount, "zajęcie", "zajęcia", "zajęć")}
                  </Text>
                </Card>
              </Pressable>
            ))
          )}
          <View key="bottom-spacer" style={{ height: 32 }} />
        </RefreshableList>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, paddingTop: tabHeaderTop, paddingBottom: 8, gap: 16 },
  cardWrap: { paddingHorizontal: 20 },
  card: { marginBottom: 8, gap: 4 },
  totalCard: { marginBottom: 12, gap: 2 },
  totalLabel: { fontSize: 12, color: colors.textFaint, fontWeight: "700" },
  totalValue: {
    fontSize: 22,
    lineHeight: lineHeights.total,
    fontWeight: "800",
    color: colors.warning,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: lineHeights.title,
    fontWeight: "700",
    color: colors.text,
  },
  cardSubtitle: { fontSize: 13, lineHeight: lineHeights.body, color: colors.textMuted },
  cardMeta: {
    fontSize: 13,
    lineHeight: lineHeights.body,
    color: colors.textFaint,
    marginTop: 2,
  },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 40 },
});
