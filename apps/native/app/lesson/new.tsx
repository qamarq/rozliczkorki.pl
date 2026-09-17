import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Chip,
  DateTimeField,
  GradientButton,
  Input,
  SectionLabel,
  Switch,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import { formatPLN } from "@/lib/format";
import { formatVacationRange, LESSON_MODE_LABELS, type LessonMode } from "@/lib/lessons";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function NewLessonScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.students.list.useQuery();

  const [studentId, setStudentId] = useState<string | null>(null);
  const params = useLocalSearchParams<{ date?: string }>();
  const [dateStr, setDateStr] = useState(params.date ?? format(new Date(), "yyyy-MM-dd"));
  const [timeStr, setTimeStr] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [prorate, setProrate] = useState(false);
  const [mode, setMode] = useState<LessonMode>("in_person");
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("transfer");
  const [customAmount, setCustomAmount] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState("");

  const { data: vacationOverview } = trpc.vacations.overview.useQuery({
    today: format(new Date(), "yyyy-MM-dd"),
  });
  const vacationOnDate = vacationOverview?.vacations.find(
    (v) => v.startDate <= dateStr && dateStr <= v.endDate,
  );

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
      utils.stats.analytics.invalidate();
      router.back();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const createRecurring = trpc.recurring.create.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      utils.stats.analytics.invalidate();
      router.back();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  function defaultRecurringEndDate() {
    const nextYear = new Date().getFullYear() + 1;
    return format(new Date(nextYear, 5, 30), "yyyy-MM-dd");
  }

  function onSubmit() {
    if (!studentId) {
      alert("Wybierz ucznia");
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
        mode,
      });
      return;
    }
    const parsedAmount = Number(paidAmount.replace(",", "."));
    if (paid && customAmount && (paidAmount === "" || Number.isNaN(parsedAmount))) {
      alert("Podaj wpłaconą kwotę");
      return;
    }
    createLesson.mutate({
      studentId,
      startsAt: new Date(`${dateStr}T${timeStr}`).toISOString(),
      durationMinutes: Number(durationMinutes),
      prorate,
      mode,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      paidAmount: paid && customAmount ? parsedAmount : null,
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
            onPress={() => {
              setStudentId(s.id);
              setMode(s.defaultMode);
            }}
          />
        ))}
      </View>

      <SectionLabel>Forma zajęć</SectionLabel>
      <View style={styles.chipRow}>
        {(["in_person", "remote"] as const).map((m) => (
          <Chip
            key={m}
            label={LESSON_MODE_LABELS[m]}
            active={mode === m}
            onPress={() => setMode(m)}
          />
        ))}
      </View>

      <DateTimeField
        label="Data"
        mode="date"
        value={new Date(`${dateStr}T00:00`)}
        onChange={(date) => setDateStr(format(date, "yyyy-MM-dd"))}
      />
      <DateTimeField
        label="Godzina"
        mode="time"
        value={new Date(`${dateStr}T${timeStr}`)}
        onChange={(date) => setTimeStr(format(date, "HH:mm"))}
      />
      {vacationOnDate && (
        <View style={styles.vacationPill}>
          <Ionicons name="airplane-outline" size={14} color={colors.warning} />
          <Text style={styles.vacationPillText}>
            Masz wtedy urlop (
            {formatVacationRange(vacationOnDate.startDate, vacationOnDate.endDate)}), ale
            zajęcia dodadzą się normalnie
          </Text>
        </View>
      )}

      <Input
        label="Czas trwania (minuty)"
        keyboardType="numeric"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Nalicz proporcjonalnie do czasu trwania</Text>
        <Switch value={prorate} onValueChange={setProrate} />
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
        <Switch value={paid} onValueChange={setPaid} />
      </View>

      {paid && (
        <>
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

          <SectionLabel>Wpłacona kwota</SectionLabel>
          <View style={styles.chipRow}>
            <Chip
              label="Pełna kwota"
              active={!customAmount}
              onPress={() => setCustomAmount(false)}
            />
            <Chip
              label="Inna kwota"
              active={customAmount}
              onPress={() => setCustomAmount(true)}
            />
          </View>
          {customAmount && (
            <Input
              placeholder="Kwota w zł"
              keyboardType="decimal-pad"
              value={paidAmount}
              onChangeText={setPaidAmount}
            />
          )}
        </>
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
        />
      </View>
      {recurring && (
        <DateTimeField
          label="Do kiedy"
          mode="date"
          value={new Date(`${recurringEndDate || defaultRecurringEndDate()}T00:00`)}
          onChange={(date) => setRecurringEndDate(format(date, "yyyy-MM-dd"))}
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
  vacationPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.warningBg,
  },
  vacationPillText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.warning,
  },
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
