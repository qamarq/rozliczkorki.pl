import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TabHeader } from "@/components/tab-header";
import { Card, ScreenBackground } from "@/components/ui";
import { formatPLN } from "@/lib/format";
import { colors, gradients, radius } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function StatsScreen() {
  const [month, setMonth] = useState(new Date());
  const from = startOfMonth(month);
  const to = endOfMonth(month);

  const { data } = trpc.stats.summary.useQuery({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  return (
    <ScreenBackground syncStatus>
      <ScrollView contentContainerStyle={styles.content}>
        <TabHeader title="Statystyki" />

        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth((m) => subMonths(m, 1))} hitSlop={12}>
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {format(month, "LLLL yyyy", { locale: pl })}
          </Text>
          <Pressable onPress={() => setMonth((m) => addMonths(m, 1))} hitSlop={12}>
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>

        <LinearGradient colors={gradients.accent} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Teoretyczne zarobki</Text>
          <Text style={styles.heroValue}>{formatPLN(data?.theoretical ?? 0)}</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard
            label="Opłacone"
            value={formatPLN(data?.paid ?? 0)}
            color={colors.success}
          />
          <StatCard
            label="Do zapłaty"
            value={formatPLN(data?.unpaid ?? 0)}
            color={colors.warning}
          />
        </View>

        <Card style={{ gap: 6 }}>
          <Text style={styles.cardTitle}>Zajęcia w miesiącu</Text>
          <Text style={styles.cardLine}>Odbyte: {data?.completedCount ?? 0}</Text>
          <Text style={styles.cardLine}>Zaplanowane: {data?.scheduledCount ?? 0}</Text>
          <Text style={styles.cardLine}>Odwołane: {data?.cancelledCount ?? 0}</Text>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.cardTitle}>Wg ucznia</Text>
          {data?.byStudent.map((row) => (
            <View key={row.studentId} style={styles.studentRow}>
              <Text style={styles.studentName}>{row.name}</Text>
              <Text style={styles.studentValue}>{formatPLN(row.theoretical)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  monthArrow: { fontSize: 26, color: colors.text },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
    width: 160,
    textAlign: "center",
  },
  heroCard: { borderRadius: radius.lg, padding: 20, gap: 4 },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroValue: { color: "#fff", fontSize: 32, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 },
  cardLine: { fontSize: 14, color: colors.textMuted },
  studentRow: { flexDirection: "row", justifyContent: "space-between" },
  studentName: { fontSize: 14, color: colors.text },
  studentValue: { fontSize: 14, fontWeight: "700", color: colors.text },
});
