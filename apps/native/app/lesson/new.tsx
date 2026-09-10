import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Chip, GradientButton, Input, SectionLabel } from "@/components/ui";
import { formatPLN } from "@/lib/format";
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
  const [prorate, setProrate] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("transfer");
  const [recurring, setRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState("");

  const { data: selectedStudent } = trpc.students.byId.useQuery(
    { id: studentId ?? "" },
    { enabled: !!studentId },
  );
  const hourlyRate = (() => {
    const rate = selectedStudent?.rates
      .filter((r) => r.effectiveFrom <= dateStr)
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0];
    return rate ? Number(rate.hourlyRate) : null;
  })();
  const previewPrice =
    hourlyRate == null
      ? 0
      : prorate
        ? (hourlyRate * Number(durationMinutes || 0)) / 60
        : hourlyRate;

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      router.back();
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  const createRecurring = trpc.recurring.create.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      router.back();
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  function defaultRecurringEndDate() {
    const nextYear = new Date().getFullYear() + 1;
    return format(new Date(nextYear, 5, 30), "yyyy-MM-dd");
  }

  function onSubmit() {
    if (!studentId) {
      Alert.alert("Wybierz ucznia");
      return;
    }
    if (recurring) {
      createRecurring.mutate({
        studentId,
        dayOfWeek: new Date(`${dateStr}T00:00`).getDay(),
        startTime: timeStr,
        durationMinutes: Number(durationMinutes),
        startDate: dateStr,
        endDate: recurringEndDate || null,
      });
      return;
    }
    createLesson.mutate({
      studentId,
      startsAt: new Date(`${dateStr}T${timeStr}`).toISOString(),
      durationMinutes: Number(durationMinutes),
      prorate,
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
        <Text style={styles.label}>Nalicz proporcjonalnie do czasu trwania</Text>
        <Switch
          value={prorate}
          onValueChange={setProrate}
          trackColor={{ true: colors.accentTo }}
        />
      </View>
      {hourlyRate != null && (
        <Text style={styles.hint}>
          {prorate
            ? `Cena = stawka × czas / 60.`
            : `Domyślnie liczymy pełną stawkę niezależnie od czasu trwania.`}{" "}
          Przy {formatPLN(hourlyRate)}/h i {durationMinutes || 0} min to{" "}
          {formatPLN(previewPrice)}.
        </Text>
      )}

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

      <View style={styles.switchRow}>
        <Text style={styles.label}>Zajęcia cykliczne (co tydzień)</Text>
        <Switch
          value={recurring}
          onValueChange={(v) => {
            setRecurring(v);
            if (v && !recurringEndDate) {
              setRecurringEndDate(defaultRecurringEndDate());
            }
          }}
          trackColor={{ true: colors.accentTo }}
        />
      </View>
      {recurring && (
        <Input
          label="Do kiedy (RRRR-MM-DD)"
          value={recurringEndDate}
          onChangeText={setRecurringEndDate}
        />
      )}

      <View style={{ marginTop: 12 }}>
        <GradientButton
          label="Dodaj zajęcia"
          onPress={onSubmit}
          loading={createLesson.isPending || createRecurring.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint, marginTop: -6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
