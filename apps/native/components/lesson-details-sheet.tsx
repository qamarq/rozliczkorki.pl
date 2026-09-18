import type { AppRouter } from "@repo/api";
import type { inferRouterClient } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { LessonRow } from "@/components/calendar/shared";
import {
  Badge,
  Chip,
  DateTimeField,
  GradientButton,
  Input,
  OutlineButton,
  SectionLabel,
  Switch,
} from "@/components/ui";
import { trackLessonCheckedOff } from "@repo/analytics";
import { flowDeps } from "@/lib/analytics";
import { alert } from "@/lib/alert";
import { closeSheet, openSheet } from "@/lib/sheet";
import { colors, radius } from "@/lib/theme";
import { queryClient, trpc } from "@/lib/trpc";
import {
  LESSON_MODE_LABELS,
  LESSON_STATUS_LABELS,
  type LessonMode,
  PAYMENT_METHOD_LABELS,
  formatPLN,
} from "@repo/shared";

function lessonsCount(n: number) {
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${n} ${n === 1 || few ? "zajęcia" : "zajęć"}`;
}

function paidCount(n: number) {
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return `${n} ${n === 1 || few ? "opłacone" : "opłaconych"}`;
}

type LessonStatus = "scheduled" | "completed" | "cancelled";
type LessonDetails = Awaited<
  ReturnType<inferRouterClient<AppRouter>["lessons"]["byId"]["query"]>
>;

export function openLessonSheet(lessonId: string) {
  openSheet(() => <LessonDetailsContent lessonId={lessonId} onClose={closeSheet} />);
}

function findCachedLesson(lessonId: string) {
  const cached = queryClient.getQueriesData<LessonRow[]>({
    queryKey: getQueryKey(trpc.lessons.range),
  });
  for (const [, rows] of cached) {
    const match = rows?.find((row) => row.id === lessonId);
    if (match) return match as LessonDetails;
  }
  return undefined;
}

function LessonDetailsContent({
  lessonId,
  onClose,
}: {
  lessonId: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: lesson } = trpc.lessons.byId.useQuery(
    { id: lessonId },
    { placeholderData: () => findCachedLesson(lessonId) },
  );

  const [status, setStatus] = useState<LessonStatus>("scheduled");
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("transfer");
  const [customAmount, setCustomAmount] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [prorate, setProrate] = useState(false);
  const [mode, setMode] = useState<LessonMode>("in_person");
  const [notes, setNotes] = useState("");
  const [cycleEndDate, setCycleEndDate] = useState("");

  const { data: lastRecurringLesson } = trpc.recurring.lastLesson.useQuery(
    { id: lesson?.recurringRuleId ?? "" },
    { enabled: !!lesson?.recurringRuleId },
  );
  const lastRecurringDate = lastRecurringLesson?.startsAt
    ? format(new Date(lastRecurringLesson.startsAt), "yyyy-MM-dd")
    : "";

  useEffect(() => {
    setCycleEndDate(lastRecurringDate);
  }, [lastRecurringDate]);

  const cycleEndChanged =
    !!lesson?.recurringRuleId && !!cycleEndDate && cycleEndDate !== lastRecurringDate;
  const cycleEndInput = {
    id: lesson?.recurringRuleId ?? "",
    until: cycleEndDate ? new Date(`${cycleEndDate}T23:59:59.999`).toISOString() : "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Warsaw",
  };
  const { data: cycleEndPreview } = trpc.recurring.previewEndDate.useQuery(
    cycleEndInput,
    {
      enabled: cycleEndChanged,
    },
  );

  useEffect(() => {
    if (!lesson) return;
    setStatus(lesson.status);
    setPaid(lesson.paid);
    setPaymentMethod(lesson.paymentMethod ?? "transfer");
    setCustomAmount(lesson.paidAmount != null);
    setPaidAmount(lesson.paidAmount ?? "");
    setDurationMinutes(String(lesson.durationMinutes));
    setProrate(lesson.prorate);
    setMode(lesson.mode);
    setNotes(lesson.notes ?? "");
  }, [lesson]);

  const { data: student } = trpc.students.byId.useQuery(
    { id: lesson?.studentId ?? "" },
    { enabled: !!lesson?.studentId },
  );
  const hourlyRate = (() => {
    if (!lesson) return null;
    const dateStr = format(new Date(lesson.startsAt), "yyyy-MM-dd");
    const rate = student?.rates
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

  const bySchool = !!lesson?.student?.schoolId;
  const carry = lesson?.carry ?? 0;
  const currentPrice =
    lesson &&
    Number(durationMinutes) === lesson.durationMinutes &&
    prorate === lesson.prorate
      ? lesson.price
      : previewPrice;
  const amountDue = Math.max(0, currentPrice - carry);
  const parsedAmount = Number(paidAmount.replace(",", "."));
  const paymentDiff =
    customAmount && paidAmount !== "" && !Number.isNaN(parsedAmount)
      ? parsedAmount - amountDue
      : 0;

  const invalidate = () => {
    utils.lessons.range.invalidate();
    utils.lessons.byId.invalidate({ id: lessonId });
    utils.recurring.lastLesson.invalidate();
    utils.vacations.overview.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };

  const updateCycleEnd = trpc.recurring.setEndDate.useMutation();

  const updateLesson = trpc.lessons.update.useMutation({
    onSuccess: async () => {
      if (lesson && status === "completed" && lesson.status !== "completed") {
        trackLessonCheckedOff(flowDeps, {
          lessonId: lesson.id,
          status,
          scheduledAt: lesson.createdAt,
        });
      }
      if (cycleEndChanged) {
        try {
          await updateCycleEnd.mutateAsync({ ...cycleEndInput, endDate: cycleEndDate });
        } catch (e) {
          alert(
            "Błąd",
            e instanceof Error ? e.message : "Nie udało się zmienić końca cyklu",
          );
        }
      }
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const deleteLesson = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  function onPaidChange(value: boolean) {
    setPaid(value);
    if (!lesson) return;
    const endsAt =
      new Date(lesson.startsAt).getTime() + Number(durationMinutes || 0) * 60_000;
    if (value && status === "scheduled" && endsAt <= Date.now()) setStatus("completed");
  }

  function performUpdate(applyToFuture: boolean) {
    if (!lesson) return;
    const trimmedNotes = notes.trim();
    if (paid && customAmount && (paidAmount === "" || Number.isNaN(parsedAmount))) {
      alert("Podaj wpłaconą kwotę");
      return;
    }
    updateLesson.mutate({
      id: lesson.id,
      durationMinutes: Number(durationMinutes),
      prorate,
      mode,
      status,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      paidAmount: paid && customAmount ? parsedAmount : null,
      ...(trimmedNotes !== (lesson.notes ?? "") ? { notes: trimmedNotes || null } : {}),
      applyToFuture,
    });
  }

  function performDelete(applyToFuture: boolean) {
    if (!lesson) return;
    deleteLesson.mutate({ id: lesson.id, applyToFuture });
  }

  function onSave() {
    if (!lesson) return;
    const recurringFieldsChanged =
      prorate !== lesson.prorate ||
      mode !== lesson.mode ||
      Number(durationMinutes) !== lesson.durationMinutes;
    if (lesson.recurringRuleId && recurringFieldsChanged) {
      alert(
        "Zapisać zmiany?",
        "Te zajęcia są częścią cyklu. Zastosować zmiany tylko do tego wystąpienia, czy też do wszystkich przyszłych zajęć w tym cyklu?",
        [
          { text: "Anuluj", style: "cancel" },
          { text: "Tylko to", onPress: () => performUpdate(false) },
          { text: "To i przyszłe", onPress: () => performUpdate(true) },
        ],
      );
      return;
    }
    performUpdate(false);
  }

  function onDelete() {
    if (!lesson) return;
    if (lesson.recurringRuleId) {
      alert(
        "Usunąć zajęcia cykliczne?",
        "Usunąć tylko to wystąpienie, czy też wszystkie przyszłe zajęcia w tym cyklu?",
        [
          { text: "Anuluj", style: "cancel" },
          { text: "Tylko to", style: "destructive", onPress: () => performDelete(false) },
          {
            text: "To i przyszłe",
            style: "destructive",
            onPress: () => performDelete(true),
          },
        ],
      );
      return;
    }
    performDelete(false);
  }

  if (!lesson) return null;

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{lesson.student?.name}</Text>
      <Text style={styles.subtitle}>
        {format(new Date(lesson.startsAt), "d MMMM, HH:mm")}
      </Text>

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
            ? "Cena = stawka × czas / 60."
            : "Domyślnie liczymy pełną stawkę niezależnie od czasu trwania."}{" "}
          Przy {formatPLN(hourlyRate)}/h i {durationMinutes || 0} min to{" "}
          {formatPLN(previewPrice)}.
        </Text>
      )}

      {lesson.recurringRuleId && cycleEndDate !== "" && (
        <>
          <DateTimeField
            label="Zajęcia cykliczne do"
            mode="date"
            value={new Date(`${cycleEndDate}T00:00`)}
            onChange={(date) => {
              const picked = format(date, "yyyy-MM-dd");
              const lessonDate = format(new Date(lesson.startsAt), "yyyy-MM-dd");
              setCycleEndDate(picked < lessonDate ? lessonDate : picked);
            }}
          />
          {cycleEndChanged && cycleEndPreview && (
            <View style={styles.chipRow}>
              {cycleEndPreview.added > 0 && (
                <Badge
                  label={`Doda ${lessonsCount(cycleEndPreview.added)}`}
                  tone="success"
                />
              )}
              {cycleEndPreview.removed > 0 && (
                <Badge
                  label={`Usunie ${lessonsCount(cycleEndPreview.removed)}`}
                  tone="danger"
                />
              )}
              {cycleEndPreview.keptPaid > 0 && (
                <Badge
                  label={`Zostawi ${paidCount(cycleEndPreview.keptPaid)}`}
                  tone="warning"
                />
              )}
            </View>
          )}
          <Text style={styles.hint}>
            Data ostatnich zajęć w cyklu. Po zmianie dodamy zajęcia w ten sam dzień
            tygodnia albo usuniemy nieopłacone.
          </Text>
        </>
      )}

      <SectionLabel>Status</SectionLabel>
      <View style={styles.chipRow}>
        {(["scheduled", "completed", "cancelled"] as const).map((s) => (
          <Chip
            key={s}
            label={LESSON_STATUS_LABELS[s]}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </View>

      {bySchool ? (
        <View style={styles.noticeBox}>
          <Text style={styles.label}>Rozlicza szkółka</Text>
          <Text style={styles.hint}>
            Status zmieni się sam, gdy zaznaczysz przelew w zakładce Szkółki.
          </Text>
        </View>
      ) : (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Opłacone</Text>
          <Switch value={paid} onValueChange={onPaidChange} />
        </View>
      )}
      {carry !== 0 && (
        <Text style={styles.hint}>
          {carry > 0
            ? `Nadpłata z poprzednich zajęć: ${formatPLN(carry)}.`
            : `Zaległość z poprzednich zajęć: ${formatPLN(-carry)}.`}{" "}
          Do zapłaty za te zajęcia: {formatPLN(amountDue)}.
        </Text>
      )}

      {paid && !bySchool && (
        <>
          <View style={styles.chipRow}>
            {(["cash", "transfer"] as const).map((method) => (
              <Chip
                key={method}
                label={PAYMENT_METHOD_LABELS[method]}
                active={paymentMethod === method}
                onPress={() => setPaymentMethod(method)}
              />
            ))}
          </View>

          <SectionLabel>Wpłacona kwota</SectionLabel>
          <View style={styles.chipRow}>
            <Chip
              label={`Pełna kwota (${formatPLN(amountDue)})`}
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
          {paymentDiff !== 0 && (
            <Text style={styles.hint}>
              {paymentDiff > 0
                ? `Nadpłata ${formatPLN(paymentDiff)} zostanie odliczona od kolejnych zajęć ucznia.`
                : `Brakujące ${formatPLN(-paymentDiff)} zostanie doliczone do kolejnych zajęć ucznia.`}
            </Text>
          )}
        </>
      )}

      <Input
        label="Notatki"
        placeholder="Co przerobiliście, zadanie domowe…"
        multiline
        value={notes}
        onChangeText={setNotes}
        style={styles.notes}
      />

      <View style={{ marginTop: 12, gap: 10 }}>
        <GradientButton
          label="Zapisz"
          onPress={onSave}
          loading={updateLesson.isPending || updateCycleEnd.isPending}
        />
        <OutlineButton
          label="Usuń zajęcia"
          tone="danger"
          onPress={onDelete}
          disabled={deleteLesson.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, textTransform: "capitalize" },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint, marginTop: -6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  notes: { minHeight: 80, textAlignVertical: "top" },
  noticeBox: {
    gap: 4,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
