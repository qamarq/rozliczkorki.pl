import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SkeletonCard, SkeletonLine, lineHeights } from "@/components/skeleton";
import { TabHeader } from "@/components/tab-header";
import {
  Badge,
  Card,
  OutlineButton,
  ScreenBackground,
  SectionLabel,
  tabScreenEdges,
} from "@/components/ui";
import { openVacationSheet } from "@/components/vacation-sheet";
import { alert } from "@/lib/alert";
import { formatVacationRange, pluralize } from "@repo/shared";
import { colors, radius, tabHeaderTop } from "@/lib/theme";
import { trpc } from "@/lib/trpc";
import { HeaderScrollView } from "@/components/scroll-edge-blur";

function lessonDates(lessons: { startsAt: Date | string }[]) {
  return lessons
    .map((l) => format(new Date(l.startsAt), "EEE d.MM HH:mm", { locale: pl }))
    .join(", ");
}

export default function VacationsScreen() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.vacations.overview.useQuery({
    today: format(new Date(), "yyyy-MM-dd"),
  });

  const setNotified = trpc.vacations.setNotified.useMutation({
    onSuccess: () => utils.vacations.overview.invalidate(),
    onError: (e) => alert("Błąd", e.message),
  });

  const deleteVacation = trpc.vacations.delete.useMutation({
    onSuccess: () => {
      utils.vacations.overview.invalidate();
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      utils.stats.analytics.invalidate();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  function confirmDelete(id: string) {
    alert(
      "Usunąć urlop?",
      "Zajęcia odwołane przez ten urlop wrócą do stanu „Zaplanowane”.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteVacation.mutate({ id }),
        },
      ],
    );
  }

  const stats = data?.stats;
  const nextLabel = stats?.current
    ? `trwa do ${format(new Date(`${stats.current.endDate}T00:00`), "d MMM", { locale: pl })}`
    : stats?.next
      ? formatVacationRange(stats.next.startDate, stats.next.endDate)
      : "brak";

  return (
    <ScreenBackground
      syncStatus
      edges={tabScreenEdges}
      header={<TabHeader title="Urlopy" />}
    >
      <HeaderScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <StatTile
            label="Dni urlopu w tym roku"
            value={String(stats?.daysThisYear ?? 0)}
            loading={isLoading}
          />
          <StatTile
            label={stats?.current ? "Obecny urlop" : "Najbliższy urlop"}
            value={nextLabel}
            small
            loading={isLoading}
          />
          <StatTile
            label="Odwołane w tym roku"
            value={String(stats?.cancelledThisYear ?? 0)}
            color={colors.danger}
            loading={isLoading}
          />
          <StatTile
            label="Do powiadomienia"
            value={String(stats?.toNotify ?? 0)}
            color={colors.warning}
            loading={isLoading}
          />
        </View>

        {Platform.OS === "ios" && (
          <OutlineButton label="+ Dodaj urlop" onPress={() => openVacationSheet()} />
        )}

        {(data?.pending.length ?? 0) > 0 && (
          <View style={{ gap: 8 }}>
            <SectionLabel>Trzeba odwołać</SectionLabel>
            {data?.pending.map((notice) => (
              <Card
                key={`${notice.vacationId}-${notice.studentId}`}
                style={styles.noticeCard}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{notice.name}</Text>
                  <Text style={styles.muted}>{lessonDates(notice.lessons)}</Text>
                  {notice.phone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${notice.phone}`)}>
                      <Text style={styles.phone}>{notice.phone}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.muted}>Brak numeru telefonu</Text>
                  )}
                </View>
                <Pressable
                  style={styles.checkButton}
                  disabled={setNotified.isPending}
                  onPress={() =>
                    setNotified.mutate({
                      vacationId: notice.vacationId,
                      studentId: notice.studentId,
                      notified: true,
                    })
                  }
                >
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={styles.checkText}>Odwołane</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}

        <View style={{ gap: 8 }}>
          <SectionLabel>Twoje urlopy</SectionLabel>
          {isLoading && <SkeletonCard lines={2} badge />}
          {!isLoading && data?.vacations.length === 0 && (
            <Text style={styles.empty}>
              Brak urlopów. Dodaj urlop, a zajęcia w tym czasie odwołają się same.
            </Text>
          )}
          {data?.vacations.map((vacation) => (
            <Card
              key={vacation.id}
              style={[styles.vacationCard, vacation.past && { opacity: 0.6 }]}
            >
              <View style={styles.vacationHead}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.name}>
                    {formatVacationRange(vacation.startDate, vacation.endDate)}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={pluralize(vacation.days, "dzień", "dni", "dni")} />
                    <Badge
                      label={`Odwołano ${pluralize(vacation.cancelledCount, "zajęcia", "zajęcia", "zajęć")}`}
                      tone={vacation.cancelledCount > 0 ? "danger" : "default"}
                    />
                  </View>
                  {vacation.note ? (
                    <Text style={styles.muted}>{vacation.note}</Text>
                  ) : null}
                </View>
                <View style={styles.vacationActions}>
                  <Pressable onPress={() => openVacationSheet(vacation)} hitSlop={10}>
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(vacation.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
              {vacation.students.map((student) => (
                <Pressable
                  key={student.studentId}
                  style={styles.studentRow}
                  onPress={() =>
                    setNotified.mutate({
                      vacationId: vacation.id,
                      studentId: student.studentId,
                      notified: !student.notified,
                    })
                  }
                >
                  <Ionicons
                    name={student.notified ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={student.notified ? colors.success : colors.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.muted}>{lessonDates(student.lessons)}</Text>
                  </View>
                </Pressable>
              ))}
            </Card>
          ))}
        </View>
      </HeaderScrollView>
    </ScreenBackground>
  );
}

function StatTile({
  label,
  value,
  color = colors.text,
  small,
  loading,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
  loading?: boolean;
}) {
  return (
    <Card style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      {loading ? (
        <SkeletonLine
          lineHeight={lineHeights.total}
          barHeight={small ? 15 : 20}
          width={small ? 108 : 56}
        />
      ) : (
        <Text
          style={[styles.statValue, { color }, small && { fontSize: 15 }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: tabHeaderTop,
    gap: 16,
    paddingBottom: 40,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statTile: { flexBasis: "48%", flexGrow: 1, gap: 6 },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  statValue: { fontSize: 22, lineHeight: lineHeights.total, fontWeight: "800" },
  noticeCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  studentName: { fontSize: 14, fontWeight: "600", color: colors.text },
  muted: { fontSize: 12, color: colors.textMuted },
  phone: { fontSize: 13, color: colors.accentTo, fontWeight: "600" },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success,
  },
  checkText: { fontSize: 12, fontWeight: "700", color: colors.success },
  vacationCard: { gap: 10 },
  vacationActions: { flexDirection: "row", gap: 16 },
  vacationHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  empty: { color: colors.textFaint, fontSize: 13 },
});
