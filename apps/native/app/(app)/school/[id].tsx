import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Badge,
  Card,
  OutlineButton,
  ScreenBackground,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui";
import { openSchoolSheet } from "@/components/school-sheet";
import { alert } from "@/lib/alert";
import {
  formatPayoutSchedule,
  formatPLN,
  PAYOUT_STATUS_LABELS,
  type PayoutStatus,
  pluralize,
} from "@repo/shared";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

const STATUS_TONE: Record<PayoutStatus, "default" | "success" | "warning" | "danger"> = {
  paid: "success",
  due: "danger",
  pending: "warning",
  open: "default",
};

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const { data: school, isLoading } = trpc.schools.byId.useQuery({ id });

  const invalidate = () => {
    utils.schools.byId.invalidate({ id });
    utils.schools.list.invalidate();
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };

  const markPayout = trpc.schools.markPayout.useMutation({
    onSuccess: invalidate,
    onError: (e) => alert("Błąd", e.message),
  });

  const unmarkPayout = trpc.schools.unmarkPayout.useMutation({
    onSuccess: invalidate,
    onError: (e) => alert("Błąd", e.message),
  });

  return (
    <ScreenBackground>
      <ScreenHeader title={school?.name ?? "Szkółka"} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading || !school ? (
          <Text style={styles.empty}>Ładowanie…</Text>
        ) : (
          <>
            <Card style={{ gap: 8 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Dane szkółki</Text>
                <Pressable onPress={() => openSchoolSheet(school.id)} hitSlop={10}>
                  <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.body}>
                {formatPayoutSchedule(school.payoutFrequency, school.payoutDay)}
              </Text>
              {school.address ? <Text style={styles.body}>{school.address}</Text> : null}
              {school.contactName ? (
                <Text style={styles.body}>{school.contactName}</Text>
              ) : null}
              {school.phone ? <Text style={styles.body}>{school.phone}</Text> : null}
              {school.email ? <Text style={styles.body}>{school.email}</Text> : null}
              {school.notes ? <Text style={styles.body}>{school.notes}</Text> : null}
            </Card>

            <SectionLabel>Historia przelewów</SectionLabel>
            {school.periods.length === 0 ? (
              <Text style={styles.hint}>
                Brak zajęć. Okresy rozliczeniowe pojawią się automatycznie.
              </Text>
            ) : (
              school.periods.map((period) => (
                <Card key={period.key} style={{ gap: 8 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{period.label}</Text>
                    <Badge
                      label={PAYOUT_STATUS_LABELS[period.status]}
                      tone={STATUS_TONE[period.status]}
                    />
                  </View>
                  <Text style={styles.hint}>
                    {pluralize(period.lessonCount, "zajęcie", "zajęcia", "zajęć")}
                    {period.dueDate
                      ? ` · termin ${format(new Date(period.dueDate), "d MMM yyyy", { locale: pl })}`
                      : ""}
                    {period.payout
                      ? ` · wpłynęło ${format(new Date(period.payout.receivedOn), "d MMM yyyy", { locale: pl })}`
                      : ""}
                  </Text>
                  <Text style={styles.amount}>
                    {formatPLN(
                      period.payout ? Number(period.payout.amount) : period.amount,
                    )}
                  </Text>
                  {period.payout ? (
                    <OutlineButton
                      label="Cofnij przelew"
                      onPress={() => unmarkPayout.mutate({ id: period.payout!.id })}
                      disabled={unmarkPayout.isPending}
                    />
                  ) : (
                    <OutlineButton
                      label="Przelew przyszedł"
                      onPress={() =>
                        markPayout.mutate({ schoolId: id, periodKey: period.key })
                      }
                      disabled={markPayout.isPending || period.lessonCount === 0}
                    />
                  )}
                </Card>
              ))
            )}
            <Card style={{ gap: 6 }}>
              <View style={styles.statRow}>
                <Text style={styles.body}>Czeka na przelew</Text>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {formatPLN(school.totals.awaiting)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.body}>Otrzymano łącznie</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatPLN(school.totals.received)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.body}>Zajęcia</Text>
                <Text style={styles.statValue}>{school.totals.lessonCount}</Text>
              </View>
            </Card>

            <SectionLabel>Uczniowie ({school.students.length})</SectionLabel>
            {school.students.length === 0 ? (
              <Text style={styles.hint}>
                Przypisz ucznia do tej szkółki w zakładce „Uczniowie”.
              </Text>
            ) : (
              <Card style={{ gap: 6 }}>
                {school.students.map((student) => (
                  <Text key={student.id} style={styles.body}>
                    {student.name}
                  </Text>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  body: { fontSize: 13, color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  amount: { fontSize: 18, fontWeight: "800", color: colors.text },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 40 },
});
