import { Host, LinearWavyProgressIndicator } from "@expo/ui/jetpack-compose";
import { addDays, format, startOfToday, subDays } from "date-fns";
import { pl } from "date-fns/locale";
import { useMemo, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { colors } from "@/lib/theme";
import { capitalize, dayKey, LessonCard, type LessonRow } from "./shared";
import { HeaderScrollView, useHeaderHeight } from "@/components/scroll-edge-blur";

const EPOCH = new Date(2000, 0, 1);

function sectionize(lessons: LessonRow[]) {
  const sections: { key: string; title: string; data: LessonRow[] }[] = [];
  for (const lesson of lessons) {
    const date = new Date(lesson.startsAt);
    const key = dayKey(date);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(lesson);
    else
      sections.push({
        key,
        title: capitalize(format(date, "EEEE, d MMMM yyyy", { locale: pl })),
        data: [lesson],
      });
  }
  return sections;
}

export function ListView() {
  const today = startOfToday();
  const from = subDays(today, 7);
  const to = addDays(today, 45);
  const [refreshing, setRefreshing] = useState(false);
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const didScroll = useRef(false);

  const recent = trpc.lessons.range.useQuery({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const older = trpc.lessons.range.useQuery({
    from: EPOCH.toISOString(),
    to: from.toISOString(),
  });

  const { past, future } = useMemo(() => {
    const olderUnpaid = (older.data ?? []).filter(
      (l) =>
        (!l.settled || l.status !== "completed") &&
        l.status !== "cancelled" &&
        new Date(l.startsAt) < from,
    );
    const all = [...olderUnpaid, ...(recent.data ?? [])];
    return {
      past: all.filter((l) => new Date(l.startsAt) < today),
      future: all.filter((l) => new Date(l.startsAt) >= today),
    };
  }, [recent.data, older.data]);

  const loading = recent.isLoading || older.isLoading;

  return (
    <HeaderScrollView
      ref={scrollRef}
      contentContainerStyle={{ paddingBottom: 110 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accentTo}
          colors={[colors.accentTo]}
          progressBackgroundColor={colors.surface}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([recent.refetch(), older.refetch()]);
            setRefreshing(false);
          }}
        />
      }
    >
      <Sections sections={sectionize(past)} past />

      <View
        style={styles.today}
        onLayout={(e) => {
          if (loading || didScroll.current) return;
          didScroll.current = true;
          scrollRef.current?.scrollTo({
            y: Math.max(0, e.nativeEvent.layout.y - 8 - headerHeight),
            animated: false,
          });
        }}
      >
        <Text style={styles.todayLabel}>
          Dziś · {format(today, "EEEE, d MMMM", { locale: pl })}
        </Text>
        <TodayWave />
      </View>

      {future.length === 0 && !loading ? (
        <Text style={styles.empty}>Brak zaplanowanych zajęć</Text>
      ) : (
        <Sections sections={sectionize(future)} />
      )}
    </HeaderScrollView>
  );
}

function Sections({
  sections,
  past,
}: {
  sections: ReturnType<typeof sectionize>;
  past?: boolean;
}) {
  return sections.map((section) => (
    <View key={section.key} style={[styles.section, past && { opacity: 0.75 }]}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      {section.data.map((item) => (
        <LessonCard key={item.id} item={item} />
      ))}
    </View>
  ));
}

function TodayWave() {
  if (Platform.OS !== "android") {
    return <View style={styles.fallbackLine} />;
  }
  return (
    <Host matchContents={{ vertical: true }} style={{ flex: 1 }}>
      <LinearWavyProgressIndicator
        progress={1}
        amplitude={1}
        wavelength={24}
        color="#a78bfa"
        trackColor={colors.border}
        stopSize={0}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textFaint,
    marginTop: 18,
    marginBottom: 8,
  },
  today: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  todayLabel: { color: "#a78bfa", fontWeight: "800", fontSize: 13 },
  fallbackLine: { flex: 1, height: 2, backgroundColor: "#a78bfa" },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 24 },
});
