"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Trash2, TreePalm } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  formatPLN,
  formatVacationRange,
  LESSON_MODE_LABELS,
  LESSON_STATUS_LABELS,
  type LessonMode,
  type LessonStatus,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  pluralize,
} from "@repo/shared";
import { trackLessonCheckedOff, trackLessonScheduled } from "@repo/analytics";
import { flowDeps } from "@/lib/analytics";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ACTION, FIELD, FormCard, FormDialogContent, SELECT, Segmented } from "./form-ui";

function defaultRecurringEndDate() {
  const nextYear = new Date().getFullYear() + 1;
  return format(new Date(nextYear, 5, 30), "yyyy-MM-dd");
}

const DURATION_PRESETS = [45, 60, 90, 120];

function lessonsCount(n: number) {
  return pluralize(n, "zajęcia", "zajęcia", "zajęć");
}

function paidCount(n: number) {
  return pluralize(n, "opłacone", "opłacone", "opłaconych");
}

type LessonRow = {
  id: string;
  studentId: string;
  startsAt: Date | string;
  createdAt: Date | string;
  durationMinutes: number;
  prorate: boolean;
  mode: LessonMode;
  status: LessonStatus;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
  paidAmount: string | null;
  price: number;
  carry: number;
  notes: string | null;
  recurringRuleId: string | null;
};

export function LessonDialog({
  open,
  onOpenChange,
  date,
  lessonId,
  allLessons,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  lessonId: string | null;
  allLessons: LessonRow[];
}) {
  const utils = trpc.useUtils();
  const { data: students = [] } = trpc.students.list.useQuery();

  const editing = lessonId ? allLessons.find((l) => l.id === lessonId) : null;
  const { data: lessonCount } = trpc.lessons.count.useQuery(undefined, { enabled: open });

  const [studentId, setStudentId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [prorate, setProrate] = useState(false);
  const [mode, setMode] = useState<LessonMode>("in_person");

  const { data: selectedStudent } = trpc.students.byId.useQuery(
    { id: studentId },
    { enabled: !!studentId },
  );

  const hourlyRate = (() => {
    const rate = selectedStudent?.rates
      .filter((r) => r.effectiveFrom <= dateStr)
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0];
    return rate ? Number(rate.hourlyRate) : null;
  })();
  const previewPrice =
    hourlyRate == null ? 0 : prorate ? (hourlyRate * durationMinutes) / 60 : hourlyRate;
  const [status, setStatus] = useState<LessonStatus>("scheduled");
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [customAmount, setCustomAmount] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");

  const carry = editing?.carry ?? 0;
  const currentPrice =
    editing && durationMinutes === editing.durationMinutes && prorate === editing.prorate
      ? editing.price
      : previewPrice;
  const amountDue = Math.max(0, currentPrice - carry);
  const paymentDiff =
    customAmount && paidAmount !== "" ? Number(paidAmount) - amountDue : 0;
  const [recurring, setRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [confirmKind, setConfirmKind] = useState<"update" | "delete" | null>(null);

  const { data: vacationOverview } = trpc.vacations.overview.useQuery(
    { today: format(new Date(), "yyyy-MM-dd") },
    { enabled: open && !editing },
  );
  const vacationOnDate = editing
    ? undefined
    : vacationOverview?.vacations.find(
        (v) => !!dateStr && v.startDate <= dateStr && dateStr <= v.endDate,
      );

  const { data: lastRecurringLesson } = trpc.recurring.lastLesson.useQuery(
    { id: editing?.recurringRuleId ?? "" },
    { enabled: open && !!editing?.recurringRuleId },
  );
  const lastRecurringDate = lastRecurringLesson?.startsAt
    ? format(new Date(lastRecurringLesson.startsAt), "yyyy-MM-dd")
    : "";
  const [cycleEndDate, setCycleEndDate] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setCycleEndDate(lastRecurringDate);
  }, [open, lastRecurringDate]);

  const cycleEndChanged =
    !!editing?.recurringRuleId && !!cycleEndDate && cycleEndDate !== lastRecurringDate;
  const cycleEndInput = {
    id: editing?.recurringRuleId ?? "",
    until: cycleEndDate ? new Date(`${cycleEndDate}T23:59:59.999`).toISOString() : "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const { data: cycleEndPreview } = trpc.recurring.previewEndDate.useQuery(
    cycleEndInput,
    {
      enabled: open && cycleEndChanged,
    },
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const d = new Date(editing.startsAt);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentId(editing.studentId);
      setDateStr(format(d, "yyyy-MM-dd"));
      setTimeStr(format(d, "HH:mm"));
      setDurationMinutes(editing.durationMinutes);
      setProrate(editing.prorate);
      setMode(editing.mode);
      setStatus(editing.status);
      setPaid(editing.paid);
      setPaymentMethod(editing.paymentMethod ?? "transfer");
      setCustomAmount(editing.paidAmount != null);
      setPaidAmount(editing.paidAmount ?? "");
      setNotes(editing.notes ?? "");
      setRecurring(false);
    } else {
      setStudentId(students[0]?.id ?? "");
      setMode(students[0]?.defaultMode ?? "in_person");
      setDateStr(format(date ?? new Date(), "yyyy-MM-dd"));
      setTimeStr("16:00");
      setDurationMinutes(60);
      setProrate(false);
      setStatus("scheduled");
      setPaid(false);
      setPaymentMethod("transfer");
      setCustomAmount(false);
      setPaidAmount("");
      setNotes("");
      setRecurring(false);
      setRecurringEndDate("");
    }
  }, [open, editing, date, students]);

  const invalidate = () => {
    utils.lessons.range.invalidate();
    utils.recurring.lastLesson.invalidate();
    utils.vacations.overview.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };

  const updateCycleEnd = trpc.recurring.setEndDate.useMutation();

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: (created) => {
      void trackLessonScheduled(flowDeps, {
        studentId: created.studentId,
        lessonDatetime: new Date(created.startsAt).toISOString(),
        countAfter: (lessonCount ?? 0) + 1,
      });
      invalidate();
      toast.success("Dodano zajęcia");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const createRecurring = trpc.recurring.create.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Dodano zajęcia cykliczne");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateLesson = trpc.lessons.update.useMutation({
    onSuccess: async () => {
      if (editing && status === "completed" && editing.status !== "completed") {
        trackLessonCheckedOff(flowDeps, {
          lessonId: editing.id,
          status,
          scheduledAt: editing.createdAt,
        });
      }
      if (cycleEndChanged) {
        try {
          await updateCycleEnd.mutateAsync({ ...cycleEndInput, endDate: cycleEndDate });
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Nie udało się zmienić końca cyklu",
          );
        }
      }
      invalidate();
      toast.success("Zapisano");
      setConfirmKind(null);
      onOpenChange(false);
    },
    onError: (e) => {
      setConfirmKind(null);
      toast.error(e.message);
    },
  });

  const deleteLesson = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Usunięto zajęcia");
      setConfirmKind(null);
      onOpenChange(false);
    },
    onError: (e) => {
      setConfirmKind(null);
      toast.error(e.message);
    },
  });

  const pending =
    createLesson.isPending ||
    createRecurring.isPending ||
    updateLesson.isPending ||
    updateCycleEnd.isPending ||
    deleteLesson.isPending;

  const paidAmountValue =
    paid && customAmount && paidAmount !== "" ? Number(paidAmount) : null;

  function onPaidChange(value: boolean) {
    setPaid(value);
    const endsAt = new Date(`${dateStr}T${timeStr}`).getTime() + durationMinutes * 60_000;
    if (value && status === "scheduled" && endsAt <= Date.now()) setStatus("completed");
  }

  function performUpdate(applyToFuture: boolean) {
    if (!editing) return;
    const startsAt = new Date(`${dateStr}T${timeStr}`).toISOString();
    updateLesson.mutate({
      id: editing.id,
      startsAt,
      durationMinutes,
      prorate,
      mode,
      status,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      paidAmount: paidAmountValue,
      notes,
      applyToFuture,
    });
  }

  function performDelete(applyToFuture: boolean) {
    if (!editing) return;
    deleteLesson.mutate({ id: editing.id, applyToFuture });
  }

  const studentName = students.find((s) => s.id === studentId)?.name;
  const startsAtPreview = dateStr ? new Date(`${dateStr}T${timeStr || "00:00"}`) : null;
  const validStart = startsAtPreview && !Number.isNaN(startsAtPreview.getTime());
  const whenLabel = validStart
    ? format(startsAtPreview, "EEEE, d MMMM · HH:mm", { locale: pl })
    : "";
  const weekdayLabel = validStart ? format(startsAtPreview, "EEEE", { locale: pl }) : "";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      toast.error("Wybierz ucznia");
      return;
    }

    if (editing) {
      const recurringFieldsChanged =
        prorate !== editing.prorate ||
        mode !== editing.mode ||
        durationMinutes !== editing.durationMinutes ||
        timeStr !== format(new Date(editing.startsAt), "HH:mm");
      if (editing.recurringRuleId && recurringFieldsChanged) {
        setConfirmKind("update");
        return;
      }
      performUpdate(false);
      return;
    }

    const startsAt = new Date(`${dateStr}T${timeStr}`).toISOString();

    if (recurring) {
      createRecurring.mutate({
        studentId,
        dayOfWeek: new Date(`${dateStr}T00:00`).getDay(),
        startTime: timeStr,
        durationMinutes,
        startDate: dateStr,
        endDate: recurringEndDate || null,
        mode,
      });
      return;
    }

    createLesson.mutate({
      studentId,
      startsAt,
      durationMinutes,
      prorate,
      mode,
      status,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      paidAmount: paidAmountValue,
      notes,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        className="sm:max-w-3xl"
        title={editing ? "Edytuj zajęcia" : "Nowe zajęcia"}
        description={
          editing
            ? [studentName, whenLabel].filter(Boolean).join(" · ")
            : "Wybierz ucznia i termin. Płatność możesz odhaczyć później."
        }
        onSubmit={onSubmit}
        footer={
          <>
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                className={ACTION}
                disabled={pending}
                onClick={() => {
                  if (editing.recurringRuleId) {
                    setConfirmKind("delete");
                  } else {
                    performDelete(false);
                  }
                }}
              >
                <Trash2 data-icon="inline-start" />
                Usuń
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className={ACTION}>
                  Anuluj
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending} className={ACTION}>
                {editing ? "Zapisz" : "Dodaj zajęcia"}
              </Button>
            </div>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <FormCard title="Termin">
            <div className="flex flex-col gap-2">
              <Label>Uczeń</Label>
              <Select
                value={studentId}
                onValueChange={(id) => {
                  setStudentId(id);
                  if (!editing) {
                    setMode(
                      students.find((s) => s.id === id)?.defaultMode ?? "in_person",
                    );
                  }
                }}
              >
                <SelectTrigger className={SELECT}>
                  <SelectValue placeholder="Wybierz ucznia" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  required
                  className={FIELD}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="time">Godzina</Label>
                <Input
                  id="time"
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  required
                  className={cn(
                    FIELD,
                    "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                  )}
                />
              </div>
            </div>

            {vacationOnDate && (
              <div className="bg-owed-soft text-warning flex items-start gap-2 rounded-[10px] px-3 py-2 text-xs font-medium">
                <TreePalm className="mt-px size-3.5 shrink-0" />
                Masz wtedy urlop (
                {formatVacationRange(vacationOnDate.startDate, vacationOnDate.endDate)}),
                ale zajęcia dodadzą się normalnie
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Czas trwania (min)</Label>
              <div className="flex gap-2">
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                  className={cn(FIELD, "w-20 shrink-0")}
                />
                <div className="grid flex-1 grid-cols-4 gap-1.5">
                  {DURATION_PRESETS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDurationMinutes(minutes)}
                      aria-pressed={durationMinutes === minutes}
                      className={cn(
                        "focus-visible:ring-ring/50 h-10 rounded-[10px] border text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2",
                        durationMinutes === minutes
                          ? "border-primary bg-accent text-accent-foreground font-semibold"
                          : "border-border-solid text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {minutes}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Segmented
                label="Status"
                value={status}
                onChange={setStatus}
                options={(Object.keys(LESSON_STATUS_LABELS) as LessonStatus[]).map(
                  (value) => ({ value, label: LESSON_STATUS_LABELS[value] }),
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Forma zajęć</Label>
              <Segmented
                label="Forma zajęć"
                value={mode}
                onChange={setMode}
                options={(["in_person", "remote"] as const).map((value) => ({
                  value,
                  label: LESSON_MODE_LABELS[value],
                }))}
              />
            </div>

            <label
              htmlFor="prorate"
              className="border-border-solid hover:bg-secondary/50 flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors"
            >
              <Checkbox
                id="prorate"
                checked={prorate}
                onCheckedChange={(v) => setProrate(v === true)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Nalicz proporcjonalnie do czasu trwania
                </span>
                <span className="text-muted-foreground text-xs">
                  {prorate
                    ? "Cena = stawka godzinowa × czas trwania / 60."
                    : "Domyślnie pełna stawka godzinowa niezależnie od czasu."}
                </span>
              </span>
            </label>

            {editing?.recurringRuleId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cycleEnd">Zajęcia cykliczne do</Label>
                <Input
                  id="cycleEnd"
                  type="date"
                  min={dateStr}
                  value={cycleEndDate}
                  disabled={!lastRecurringDate}
                  onChange={(e) => setCycleEndDate(e.target.value)}
                  className={FIELD}
                />
                {cycleEndChanged && cycleEndPreview && (
                  <div className="flex flex-wrap gap-1.5">
                    {cycleEndPreview.added > 0 && (
                      <Badge variant="secondary">
                        Doda {lessonsCount(cycleEndPreview.added)}
                      </Badge>
                    )}
                    {cycleEndPreview.removed > 0 && (
                      <Badge variant="destructive">
                        Usunie {lessonsCount(cycleEndPreview.removed)}
                      </Badge>
                    )}
                    {cycleEndPreview.keptPaid > 0 && (
                      <Badge variant="outline">
                        Zostawi {paidCount(cycleEndPreview.keptPaid)}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Data ostatnich zajęć w cyklu. Po zmianie dodamy zajęcia w ten sam dzień
                  tygodnia albo usuniemy nieopłacone.
                </p>
              </div>
            )}

            {!editing && (
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="recurring"
                  className="border-border-solid hover:bg-secondary/50 flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 transition-colors"
                >
                  <Checkbox
                    id="recurring"
                    checked={recurring}
                    className="mt-0.5"
                    onCheckedChange={(v) => {
                      const isChecked = v === true;
                      setRecurring(isChecked);
                      if (isChecked && !recurringEndDate) {
                        setRecurringEndDate(defaultRecurringEndDate());
                      }
                    }}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Zajęcia cykliczne</span>
                    <span className="text-muted-foreground text-xs">
                      {weekdayLabel
                        ? `Co tydzień: ${weekdayLabel}, ${timeStr}`
                        : "Co tydzień w ten sam dzień i o tej samej godzinie."}
                    </span>
                  </span>
                </label>
                {recurring && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="recurringEnd">Do kiedy (opcjonalnie)</Label>
                    <Input
                      id="recurringEnd"
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className={FIELD}
                    />
                  </div>
                )}
              </div>
            )}
          </FormCard>

          <div className="flex flex-col gap-4">
            <FormCard title="Rozliczenie">
              <div className="flex flex-col gap-2 text-sm">
                <div className="text-muted-foreground flex justify-between gap-3">
                  <span>
                    Cena zajęć
                    {hourlyRate != null &&
                      ` (${formatPLN(hourlyRate)}/h · ${durationMinutes} min)`}
                  </span>
                  <span className="text-foreground tabular-nums">
                    {formatPLN(currentPrice)}
                  </span>
                </div>
                {carry !== 0 && (
                  <div className="text-muted-foreground flex justify-between gap-3">
                    <span>
                      {carry > 0
                        ? "Nadpłata z poprzednich zajęć"
                        : "Zaległość z poprzednich zajęć"}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums",
                        carry > 0 ? "text-success" : "text-warning",
                      )}
                    >
                      {carry > 0 ? "−" : "+"}
                      {formatPLN(Math.abs(carry))}
                    </span>
                  </div>
                )}
                <div className="border-border mt-1 flex items-baseline justify-between gap-3 border-t pt-3">
                  <span className="font-medium">Do zapłaty</span>
                  <span className="text-2xl font-bold tabular-nums tracking-tight">
                    {formatPLN(amountDue)}
                  </span>
                </div>
              </div>

              {selectedStudent?.schoolId ? (
                <div className="bg-secondary flex flex-col gap-1 rounded-[10px] p-3">
                  <span className="text-sm font-medium">Rozlicza szkółka</span>
                  <span className="text-muted-foreground text-xs">
                    Status zmieni się sam, gdy zaznaczysz przelew w zakładce „Szkółki”.
                  </span>
                </div>
              ) : (
                <label
                  htmlFor="paid"
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border p-3 transition-colors",
                    paid ? "border-success/40 bg-paid-soft" : "border-border-solid",
                  )}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Opłacone</span>
                    <span className="text-muted-foreground text-xs">
                      {paid ? "Płatność jest odnotowana." : "Uczeń jeszcze nie zapłacił."}
                    </span>
                  </span>
                  <Switch id="paid" checked={paid} onCheckedChange={onPaidChange} />
                </label>
              )}

              {paid && !selectedStudent?.schoolId && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Sposób płatności</Label>
                    <Segmented
                      label="Sposób płatności"
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={(
                        Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
                      ).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Wpłacona kwota</Label>
                    <Segmented
                      label="Wpłacona kwota"
                      value={customAmount ? "custom" : "full"}
                      onChange={(v) => setCustomAmount(v === "custom")}
                      options={[
                        { value: "full", label: "Pełna kwota" },
                        { value: "custom", label: "Inna kwota" },
                      ]}
                    />
                  </div>
                  {customAmount && (
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`Kwota w zł, np. ${amountDue}`}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      required
                      className={FIELD}
                    />
                  )}
                  {paymentDiff !== 0 && (
                    <p className="text-muted-foreground text-xs">
                      {paymentDiff > 0
                        ? `Nadpłata ${formatPLN(paymentDiff)} zostanie odliczona od kolejnych zajęć ucznia.`
                        : `Brakujące ${formatPLN(-paymentDiff)} zostanie doliczone do kolejnych zajęć ucznia.`}
                    </p>
                  )}
                </div>
              )}
            </FormCard>

            <FormCard title="Notatki">
              <Textarea
                id="notes"
                aria-label="Notatki"
                placeholder="Np. co przerobić następnym razem"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-24 rounded-[10px]"
              />
            </FormCard>
          </div>
        </div>
      </FormDialogContent>

      <AlertDialog
        open={confirmKind !== null}
        onOpenChange={(o) => !o && setConfirmKind(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmKind === "delete" ? "Usunąć zajęcia cykliczne?" : "Zapisać zmiany?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Te zajęcia są częścią cyklu (co tydzień). Czy{" "}
              {confirmKind === "delete" ? "usunąć" : "zastosować zmiany"} tylko to
              wystąpienie, czy też wszystkie przyszłe zajęcia w tym cyklu?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  confirmKind === "delete" ? performDelete(false) : performUpdate(false)
                }
              >
                Tylko to
              </Button>
              <AlertDialogAction
                disabled={pending}
                onClick={() =>
                  confirmKind === "delete" ? performDelete(true) : performUpdate(true)
                }
              >
                To i przyszłe
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
