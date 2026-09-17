"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Video } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { localDayRange, pluralize } from "@/lib/lessons";
import { trpc } from "@/lib/trpc/client";

export type EditableVacation = {
  id: string;
  startDate: string;
  endDate: string;
  note: string | null;
};

export function VacationDialog({
  open,
  onOpenChange,
  vacation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacation?: EditableVacation | null;
}) {
  const utils = trpc.useUtils();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [keepIds, setKeepIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const today = format(new Date(), "yyyy-MM-dd");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartDate(vacation?.startDate ?? today);
    setEndDate(vacation?.endDate ?? today);
    setNote(vacation?.note ?? "");
    setKeepIds([]);
  }, [open, vacation]);

  const validRange = !!startDate && !!endDate && endDate >= startDate;
  const rangeInput = {
    startDate,
    endDate,
    ...(validRange ? localDayRange(startDate, endDate) : { from: "", to: "" }),
  };
  const { data: preview, isFetching } = trpc.vacations.preview.useQuery(
    { ...rangeInput, vacationId: vacation?.id },
    { enabled: open && validRange },
  );
  const affected = preview?.toCancel ?? [];
  const restoreCount = preview?.restoreCount ?? 0;
  const remoteLessons = affected.filter((l) => l.mode === "remote");
  const cancelCount = affected.filter((l) => !keepIds.includes(l.id)).length;

  const onSaved = (cancelledCount: number, message: string) => {
    utils.vacations.overview.invalidate();
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
    toast.success(
      cancelledCount > 0
        ? `${message} i odwołano ${pluralize(cancelledCount, "zajęcia", "zajęcia", "zajęć")}`
        : message,
    );
    onOpenChange(false);
  };

  const createVacation = trpc.vacations.create.useMutation({
    onSuccess: (saved) => onSaved(saved.cancelledCount, "Dodano urlop"),
    onError: (e) => toast.error(e.message),
  });

  const updateVacation = trpc.vacations.update.useMutation({
    onSuccess: (saved) => onSaved(saved.cancelledCount, "Zapisano urlop"),
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRange) {
      toast.error("Data końca nie może być wcześniejsza niż data początku");
      return;
    }
    const payload = {
      ...rangeInput,
      note: note || undefined,
      keepLessonIds: keepIds.filter((id) => remoteLessons.some((l) => l.id === id)),
    };
    if (vacation) {
      updateVacation.mutate({ ...payload, id: vacation.id });
    } else {
      createVacation.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vacation ? "Edytuj urlop" : "Nowy urlop"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vacationStart">Od</Label>
              <Input
                id="vacationStart"
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vacationEnd">Do</Label>
              <Input
                id="vacationEnd"
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vacationNote">Notatka (opcjonalnie)</Label>
            <Textarea
              id="vacationNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="np. wyjazd w góry"
              className="min-h-16"
            />
          </div>

          {validRange && !isFetching && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={cancelCount > 0 ? "destructive" : "secondary"}>
                {cancelCount > 0
                  ? `Odwoła ${pluralize(cancelCount, "zajęcia", "zajęcia", "zajęć")}`
                  : vacation
                    ? "Brak nowych zajęć do odwołania"
                    : "Brak zajęć do odwołania"}
              </Badge>
              {restoreCount > 0 && (
                <Badge variant="outline">
                  Przywróci {pluralize(restoreCount, "zajęcia", "zajęcia", "zajęć")}
                </Badge>
              )}
              {keepIds.length > 0 && (
                <Badge variant="outline">
                  Zachowa{" "}
                  {pluralize(
                    keepIds.length,
                    "zajęcia online",
                    "zajęcia online",
                    "zajęć online",
                  )}
                </Badge>
              )}
            </div>
          )}

          {remoteLessons.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Zajęcia online w tym czasie</span>
                <span className="text-muted-foreground text-xs">
                  Zaznacz te, które chcesz zachować mimo urlopu.
                </span>
              </div>
              {remoteLessons.map((lesson) => (
                <label key={lesson.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={keepIds.includes(lesson.id)}
                    onCheckedChange={(checked) =>
                      setKeepIds((ids) =>
                        checked === true
                          ? [...ids, lesson.id]
                          : ids.filter((id) => id !== lesson.id),
                      )
                    }
                  />
                  <Video className="text-muted-foreground size-3.5" />
                  <span>
                    {format(new Date(lesson.startsAt), "EEE d.MM, HH:mm", { locale: pl })}{" "}
                    · {lesson.studentName}
                  </span>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={createVacation.isPending || updateVacation.isPending}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {vacation ? "Zapisz" : "Dodaj urlop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
