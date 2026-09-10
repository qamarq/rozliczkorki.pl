import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Chip, GradientButton, OutlineButton, SectionLabel } from "@/components/ui";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

type LessonStatus = "scheduled" | "completed" | "cancelled";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: lesson } = trpc.lessons.byId.useQuery({ id });

  const [status, setStatus] = useState<LessonStatus>("scheduled");
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("transfer");

  useEffect(() => {
    if (!lesson) return;
    setStatus(lesson.status);
    setPaid(lesson.paid);
    setPaymentMethod(lesson.paymentMethod ?? "transfer");
  }, [lesson]);

  const updateLesson = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.lessons.byId.invalidate({ id });
      router.back();
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  const deleteLesson = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      router.back();
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  if (!lesson) return null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>{lesson.student?.name}</Text>
      <Text style={styles.subtitle}>
        {format(new Date(lesson.startsAt), "d MMMM, HH:mm")} · {lesson.durationMinutes}{" "}
        min
      </Text>

      <SectionLabel>Status</SectionLabel>
      <View style={styles.chipRow}>
        {(["scheduled", "completed", "cancelled"] as const).map((s) => (
          <Chip
            key={s}
            label={
              s === "scheduled"
                ? "Zaplanowane"
                : s === "completed"
                  ? "Odbyły się"
                  : "Odwołane"
            }
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Opłacone</Text>
        <Switch
          value={paid}
          onValueChange={setPaid}
          trackColor={{ true: colors.accentTo }}
        />
      </View>

      {paid && (
        <View style={styles.chipRow}>
          <Chip
            label="Gotówka"
            active={paymentMethod === "cash"}
            onPress={() => setPaymentMethod("cash")}
          />
          <Chip
            label="Przelew"
            active={paymentMethod === "transfer"}
            onPress={() => setPaymentMethod("transfer")}
          />
        </View>
      )}

      <View style={{ marginTop: 12, gap: 10 }}>
        <GradientButton
          label="Zapisz"
          onPress={() =>
            updateLesson.mutate({
              id: lesson.id,
              status,
              paid,
              paymentMethod: paid ? paymentMethod : null,
            })
          }
          loading={updateLesson.isPending}
        />
        <OutlineButton
          label="Usuń zajęcia"
          tone="danger"
          onPress={() => deleteLesson.mutate({ id: lesson.id })}
          disabled={deleteLesson.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, textTransform: "capitalize" },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
