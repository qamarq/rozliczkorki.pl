import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Chip, GradientButton, Input, SectionLabel } from "@/components/ui";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function NewLessonScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.students.list.useQuery();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeStr, setTimeStr] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("transfer");

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      router.back();
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  function onSubmit() {
    if (!studentId) {
      Alert.alert("Wybierz ucznia");
      return;
    }
    createLesson.mutate({
      studentId,
      startsAt: new Date(`${dateStr}T${timeStr}`).toISOString(),
      durationMinutes: Number(durationMinutes),
      paid,
      paymentMethod: paid ? paymentMethod : null,
    });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.content}
    >
      <SectionLabel>Uczeń</SectionLabel>
      <View style={styles.chipRow}>
        {students.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            active={studentId === s.id}
            onPress={() => setStudentId(s.id)}
          />
        ))}
      </View>

      <Input label="Data (RRRR-MM-DD)" value={dateStr} onChangeText={setDateStr} />
      <Input label="Godzina (GG:MM)" value={timeStr} onChangeText={setTimeStr} />
      <Input
        label="Czas trwania (minuty)"
        keyboardType="numeric"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
      />

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

      <View style={{ marginTop: 12 }}>
        <GradientButton
          label="Dodaj zajęcia"
          onPress={onSubmit}
          loading={createLesson.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
