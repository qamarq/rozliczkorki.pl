"use client";

import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc/client";
import { formatPLN } from "@/lib/utils";

type LessonStatus = "scheduled" | "completed" | "cancelled";
type PaymentMethod = "cash" | "transfer";

function defaultRecurringEndDate() {
  const nextYear = new Date().getFullYear() + 1;
  return format(new Date(nextYear, 5, 30), "yyyy-MM-dd");
}

type LessonRow = {
  id: string;
  studentId: string;
  startsAt: Date | string;
  durationMinutes: number;
  prorate: boolean;
  status: LessonStatus;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
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

  const [studentId, setStudentId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [prorate, setProrate] = useState(false);

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
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [confirmKind, setConfirmKind] = useState<"update" | "delete" | null>(null);

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
      setStatus(editing.status);
      setPaid(editing.paid);
      setPaymentMethod(editing.paymentMethod ?? "transfer");
      setNotes(editing.notes ?? "");
      setRecurring(false);
    } else {
      setStudentId(students[0]?.id ?? "");
      setDateStr(format(date ?? new Date(), "yyyy-MM-dd"));
      setTimeStr("16:00");
      setDurationMinutes(60);
      setProrate(false);
      setStatus("scheduled");
      setPaid(false);
      setPaymentMethod("transfer");
      setNotes("");
      setRecurring(false);
      setRecurringEndDate("");
    }
  }, [open, editing, date, students]);

  const invalidate = () => {
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
  };

  const createLesson = trpc.lessons.create.useMutation({
    onSuccess: () => {
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
    onSuccess: () => {
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
    deleteLesson.isPending;

  function performUpdate(applyToFuture: boolean) {
    if (!editing) return;
    const startsAt = new Date(`${dateStr}T${timeStr}`).toISOString();
    updateLesson.mutate({
      id: editing.id,
      startsAt,
      durationMinutes,
      prorate,
      status,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      notes,
      applyToFuture,
    });
  }

  function performDelete(applyToFuture: boolean) {
    if (!editing) return;
    deleteLesson.mutate({ id: editing.id, applyToFuture });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      toast.error("Wybierz ucznia");
      return;
    }

    if (editing) {
      if (editing.recurringRuleId) {
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
      });
      return;
    }

    createLesson.mutate({
      studentId,
      startsAt,
      durationMinutes,
      prorate,
      status,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      notes,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edytuj zajęcia" : "Nowe zajęcia"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Uczeń</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full">
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
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">Czas trwania (minuty)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="prorate"
                checked={prorate}
                onCheckedChange={(v) => setProrate(v === true)}
              />
              <Label htmlFor="prorate">Nalicz proporcjonalnie do czasu trwania</Label>
            </div>
            <p className="text-muted-foreground text-xs">
              {prorate
                ? "Cena = stawka godzinowa × czas trwania / 60."
                : "Domyślnie liczymy pełną stawkę godzinową niezależnie od czasu trwania."}
              {hourlyRate != null && (
                <>
                  {" "}
                  Przy stawce {formatPLN(hourlyRate)}/h i {durationMinutes} min to{" "}
                  <span className="text-foreground font-medium">
                    {formatPLN(previewPrice)}
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LessonStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Zaplanowane</SelectItem>
                <SelectItem value="completed">Odbyły się</SelectItem>
                <SelectItem value="cancelled">Odwołane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="paid">Opłacone</Label>
            <Switch id="paid" checked={paid} onCheckedChange={setPaid} />
          </div>

          {paid && (
            <div className="flex flex-col gap-2">
              <Label>Sposób płatności</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Gotówka</SelectItem>
                  <SelectItem value="transfer">Przelew</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {!editing && (
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={recurring}
                  onCheckedChange={(v) => {
                    const isChecked = v === true;
                    setRecurring(isChecked);
                    if (isChecked && !recurringEndDate) {
                      setRecurringEndDate(defaultRecurringEndDate());
                    }
                  }}
                />
                <Label htmlFor="recurring">Zajęcia cykliczne (co tydzień)</Label>
              </div>
              {recurring && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="recurringEnd">Do kiedy (opcjonalnie)</Label>
                  <Input
                    id="recurringEnd"
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  if (editing.recurringRuleId) {
                    setConfirmKind("delete");
                  } else {
                    performDelete(false);
                  }
                }}
              >
                Usuń
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              disabled={pending}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {editing ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={confirmKind !== null} onOpenChange={(o) => !o && setConfirmKind(null)}>
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
