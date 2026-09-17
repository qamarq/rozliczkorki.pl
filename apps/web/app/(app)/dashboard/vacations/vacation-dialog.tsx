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

export function VacationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    setStartDate(today);
    setEndDate(today);
    setNote("");
    setKeepIds([]);
  }, [open]);

  const validRange = !!startDate && !!endDate && endDate >= startDate;
  const rangeInput = {
    startDate,
    endDate,
    ...(validRange ? localDayRange(startDate, endDate) : { from: "", to: "" }),
  };
  const { data: affected = [], isFetching } = trpc.vacations.preview.useQuery(
    rangeInput,
    {
      enabled: open && validRange,
    },
  );
  const remoteLessons = affected.filter((l) => l.mode === "remote");
  const cancelCount = affected.filter((l) => !keepIds.includes(l.id)).length;

  const createVacation = trpc.vacations.create.useMutation({
    onSuccess: (vacation) => {
      utils.vacations.overview.invalidate();
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      toast.success(
        vacation.cancelledCount > 0
          ? `Dodano urlop i odwołano ${pluralize(vacation.cancelledCount, "zajęcia", "zajęcia", "zajęć")}`
          : "Dodano urlop",
      );
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRange) {
      toast.error("Data końca nie może być wcześniejsza niż data początku");
      return;
    }
    createVacation.mutate({
      ...rangeInput,
      note: note || undefined,
      keepLessonIds: keepIds.filter((id) => remoteLessons.some((l) => l.id === id)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy urlop</DialogTitle>
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
                  : "Brak zajęć do odwołania"}
              </Badge>
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
              disabled={createVacation.isPending}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              Dodaj urlop
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
