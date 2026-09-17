import { useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TrendChart } from "@/components/trend-chart";
import { Card, Chip, ScreenBackground, ScreenHeader } from "@/components/ui";
import { formatPLN } from "@repo/shared";
import {
  buildBuckets,
  formatRange,
  granularityFor,
  PRESETS,
  presetRange,
  previousRange,
  type PresetId,
} from "@repo/shared";
import { colors, gradients, radius } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

type Metric = "revenue" | "lessons" | "hours";

const METRICS: { id: Metric; label: string }[] = [
  { id: "revenue", label: "Przychód" },
  { id: "lessons", label: "Zajęcia" },
  { id: "hours", label: "Godziny" },
];

const GRANULARITY_LABEL = {
  day: "dziennie",
  week: "tygodniowo",
  month: "miesięcznie",
} as const;

export default function StatsScreen() {
  const now = useMemo(() => new Date(), []);
  const [preset, setPreset] = useState<PresetId>("this-month");
  const [metric, setMetric] = useState<Metric>("revenue");

  const range = useMemo(() => presetRange(preset, now), [preset, now]);
  const granularity = granularityFor(range);
  const buckets = useMemo(() => buildBuckets(range, granularity), [range, granularity]);
  const compare = useMemo(() => {
    const previous = previousRange(range);
    return { from: previous.from.toISOString(), to: previous.to.toISOString() };
  }, [range]);

  const { data } = trpc.stats.analytics.useQuery({
    buckets,
    compare,
    now: now.toISOString(),
  });

  const totals = data?.totals;
  const series = data?.series ?? [];

  const points = series.map((bucket) => ({
    label: bucket.label,
    value:
      metric === "revenue"
        ? bucket.revenue
        : metric === "lessons"
          ? bucket.lessons
          : bucket.hours,
    forecast: !bucket.isPast,
  }));

  const formatMetric = (value: number) =>
    metric === "revenue"
      ? formatPLN(value)
      : metric === "hours"
        ? `${Math.round(value * 10) / 10} h`
        : `${value}`;

  const revenueDelta = delta(totals?.billed, data?.compare?.billed);
  const planned = (totals?.planned ?? 0) + (totals?.projected ?? 0);
  const segments = [
    { key: "paid", label: "Opłacone", value: totals?.paid ?? 0, color: colors.success },
    {
      key: "awaiting",
      label: "Do wypłaty",
      value: totals?.awaitingPayout ?? 0,
      color: colors.warning,
    },
    {
      key: "unpaid",
      label: "Zaległe",
      value: totals?.unpaid ?? 0,
      color: colors.danger,
    },
    {
      key: "planned",
      label: "Zaplanowane",
      value: planned,
      color: "rgba(255,255,255,0.45)",
    },
  ];
  const segmentTotal = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const lessonsTotal = (totals?.lessonCount ?? 0) + (totals?.projectedLessons ?? 0);

  return (
    <ScreenBackground syncStatus>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Statystyki" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {PRESETS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              active={preset === item.id}
              onPress={() => setPreset(item.id)}
            />
          ))}
        </ScrollView>
        <Text style={styles.rangeLabel}>{formatRange(range)}</Text>

        <LinearGradient colors={gradients.accent} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Przychód w okresie</Text>
          <View style={styles.heroValueRow}>
            <Text style={styles.heroValue}>{formatPLN(totals?.expected ?? 0)}</Text>
            {revenueDelta !== null && (
              <Text style={styles.heroDelta}>
                {revenueDelta >= 0 ? "▲" : "▼"} {Math.abs(revenueDelta)}%
              </Text>
            )}
          </View>
          <Text style={styles.heroHint}>
            {(totals?.projected ?? 0) > 0
              ? `w tym ${formatPLN(totals?.projected ?? 0)} prognozy z cykli`
              : "w porównaniu z poprzednim okresem tej samej długości"}
          </Text>

          <View style={styles.segmentBar}>
            {segments.map((segment) => (
              <View
                key={segment.key}
                style={{
                  flex: segment.value / segmentTotal,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </View>
          {segments.map((segment) => (
            <View key={segment.key} style={styles.segmentRow}>
              <View style={[styles.dot, { backgroundColor: segment.color }]} />
              <Text style={styles.segmentLabel}>{segment.label}</Text>
              <Text style={styles.segmentValue}>{formatPLN(segment.value)}</Text>
            </View>
          ))}
        </LinearGradient>

        <Card style={{ gap: 12 }}>
          <View style={styles.metricRow}>
            {METRICS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={metric === item.id}
                onPress={() => setMetric(item.id)}
              />
            ))}
          </View>
          <Text style={styles.chartHint}>
            {GRANULARITY_LABEL[granularity]}
            {points.some((p) => p.forecast) ? " · przerywana linia to prognoza" : ""}
          </Text>
          <TrendChart points={points} formatValue={formatMetric} />
        </Card>

        <View style={styles.tileRow}>
          <Tile
            label="Zajęcia"
            value={`${lessonsTotal}`}
            delta={delta(totals?.lessonCount, data?.compare?.lessonCount)}
            hint={`${totals?.completed ?? 0} odbytych · ${totals?.cancelled ?? 0} odwołanych`}
          />
          <Tile
            label="Godziny"
            value={`${totals?.hours ?? 0} h`}
            delta={delta(totals?.hours, data?.compare?.hours)}
            hint={`${totals?.activeStudents ?? 0} uczniów w okresie`}
          />
        </View>
        <View style={styles.tileRow}>
          <Tile
            label="Stawka efektywna"
            value={`${formatPLN(totals?.effectiveHourlyRate ?? 0)}/h`}
            delta={delta(totals?.effectiveHourlyRate, data?.compare?.effectiveHourlyRate)}
            hint="Przychód na godzinę"
          />
          <Tile
            label="Ściągalność"
            value={`${totals?.collectionRate ?? 0}%`}
            hint={`Zaległości ${formatPLN(data?.debt.outstanding ?? 0)}`}
          />
        </View>

        <Card style={{ gap: 12 }}>
          <Text style={styles.cardTitle}>Uczniowie</Text>
          {(data?.byStudent ?? []).length === 0 && (
            <Text style={styles.muted}>Brak zajęć w tym zakresie</Text>
          )}
          {(data?.byStudent ?? []).map((student) => {
            const ratio =
              student.billed > 0
                ? Math.min(100, Math.round((student.paid / student.billed) * 100))
                : 0;
            return (
              <View key={student.studentId} style={{ gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentValue}>{formatPLN(student.billed)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${ratio}%`,
                        backgroundColor: ratio === 100 ? colors.success : colors.warning,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.muted}>
                  {student.lessonCount} zajęć · {student.hours} h · opłacone {ratio}%
                </Text>
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Zaległości</Text>
            <Text style={[styles.studentValue, { color: colors.warning }]}>
              {formatPLN(data?.debt.outstanding ?? 0)}
            </Text>
          </View>
          {(data?.debt.debtors ?? []).length === 0 ? (
            <Text style={styles.muted}>Wszystko rozliczone, brak długów.</Text>
          ) : (
            (data?.debt.debtors ?? []).slice(0, 6).map((debtor) => (
              <View key={debtor.studentId} style={styles.rowBetween}>
                <Text style={styles.studentName}>{debtor.name}</Text>
                <Text style={styles.studentValue}>{formatPLN(debtor.amount)}</Text>
              </View>
            ))
          )}
          <Text style={styles.muted}>
            Ze wszystkich zajęć, które już się odbyły, nie tylko z tego zakresu.
          </Text>
        </Card>

        <Card style={{ gap: 16 }}>
          <Text style={styles.cardTitle}>Struktura okresu</Text>
          <Meter
            title="Tryb zajęć"
            label="Stacjonarne"
            secondaryLabel="Online"
            value={data?.splits.mode.in_person ?? 0}
            secondary={data?.splits.mode.remote ?? 0}
            format={(v) => `${v}`}
          />
          <Meter
            title="Płatności"
            label="Gotówka"
            secondaryLabel="Przelew"
            value={data?.splits.payment.cash ?? 0}
            secondary={data?.splits.payment.transfer ?? 0}
            format={formatPLN}
            note={
              (data?.splits.payment.unknown ?? 0) > 0
                ? `Bez formy płatności: ${formatPLN(data?.splits.payment.unknown ?? 0)}`
                : undefined
            }
          />
          <Meter
            title="Typ ucznia"
            label="Prywatni"
            secondaryLabel="Szkoła"
            value={data?.splits.type.private ?? 0}
            secondary={data?.splits.type.school ?? 0}
            format={formatPLN}
          />
        </Card>
      </ScrollView>
    </ScreenBackground>
  );
}

function delta(current?: number, previous?: number) {
  if (current == null || previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function Tile({
  label,
  value,
  hint,
  delta: change,
}: {
  label: string;
  value: string;
  hint: string;
  delta?: number | null;
}) {
  return (
    <Card style={styles.tile}>
      <View style={styles.rowBetween}>
        <Text style={styles.tileLabel}>{label}</Text>
        {change != null && (
          <Text
            style={[
              styles.tileDelta,
              { color: change >= 0 ? colors.success : colors.danger },
            ]}
          >
            {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
          </Text>
        )}
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.muted} numberOfLines={1}>
        {hint}
      </Text>
    </Card>
  );
}

function Meter({
  title,
  label,
  secondaryLabel,
  value,
  secondary,
  format,
  note,
}: {
  title: string;
  label: string;
  secondaryLabel: string;
  value: number;
  secondary: number;
  format: (value: number) => string;
  note?: string;
}) {
  const total = value + secondary;
  const ratio = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.muted}>{title}</Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${ratio}%`, backgroundColor: colors.accentTo },
          ]}
        />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.meterLabel}>
          {label} <Text style={styles.muted}>{format(value)}</Text>
        </Text>
        <Text style={styles.meterLabel}>
          {secondaryLabel} <Text style={styles.muted}>{format(secondary)}</Text>
        </Text>
      </View>
      {note && <Text style={styles.muted}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  chipRow: { gap: 8, paddingRight: 8 },
  rangeLabel: { color: colors.textMuted, fontSize: 12, textTransform: "capitalize" },
  heroCard: { borderRadius: radius.lg, padding: 20, gap: 8 },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroValueRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  heroValue: { color: "#fff", fontSize: 30, fontWeight: "800" },
  heroDelta: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700" },
  heroHint: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  segmentBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 6,
  },
  segmentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  segmentLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, flex: 1 },
  segmentValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  metricRow: { flexDirection: "row", gap: 8 },
  chartHint: { color: colors.textFaint, fontSize: 11 },
  tileRow: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, gap: 2 },
  tileLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  tileDelta: { fontSize: 11, fontWeight: "700" },
  tileValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  muted: { color: colors.textMuted, fontSize: 12 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  studentName: { fontSize: 14, color: colors.text, flexShrink: 1 },
  studentValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.full },
  meterLabel: { color: colors.text, fontSize: 13 },
});
