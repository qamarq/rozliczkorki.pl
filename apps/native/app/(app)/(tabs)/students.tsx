import { format } from "date-fns";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, OutlineButton, ScreenBackground } from "@/components/ui";
import { RefreshableList } from "@/components/refreshable-list";
import { openStudentSheet } from "@/components/student-sheet";
import { TabHeader } from "@/components/tab-header";
import { formatPLN } from "@repo/shared";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function StudentsScreen() {
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();

  return (
    <ScreenBackground syncStatus>
      <View style={{ flex: 1 }}>
        <RefreshableList onRefresh={refetch}>
          <View key="head" style={styles.head}>
            <TabHeader title="Uczniowie" />
            <OutlineButton label="+ Dodaj ucznia" onPress={() => openStudentSheet()} />
          </View>
          {students.length === 0 && !isLoading ? (
            <Text key="empty" style={styles.empty}>
              Brak uczniów
            </Text>
          ) : (
            students.map((item) => (
              <Pressable
                key={item.id}
                style={styles.cardWrap}
                onPress={() => openStudentSheet(item.id)}
              >
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Badge
                      label={item.school ? item.school.name : "korki"}
                      tone={item.school ? "success" : "default"}
                    />
                  </View>
                  {(item.school?.address ?? item.address) ? (
                    <Text style={styles.cardSubtitle}>
                      {item.school?.address ?? item.address}
                    </Text>
                  ) : null}
                  {item.phone ? (
                    <Text style={styles.cardSubtitle}>{item.phone}</Text>
                  ) : null}
                  <RateSummary studentId={item.id} />
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

function RateSummary({ studentId }: { studentId: string }) {
  const { data } = trpc.students.byId.useQuery({ id: studentId });
  const currentRate = data?.rates[0];
  if (!currentRate) return null;
  return (
    <Text style={styles.rateText}>
      {formatPLN(Number(currentRate.hourlyRate))}/h od{" "}
      {format(new Date(currentRate.effectiveFrom), "dd.MM.yyyy")}
    </Text>
  );
}

const styles = StyleSheet.create({
  head: { padding: 20, paddingBottom: 8, gap: 16 },
  cardWrap: { paddingHorizontal: 20 },
  card: { marginBottom: 8, gap: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.textMuted },
  rateText: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 40 },
});
