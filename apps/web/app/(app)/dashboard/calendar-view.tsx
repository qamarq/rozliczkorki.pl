"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPLN } from "@/lib/utils";
import { LessonDialog } from "./lesson-dialog";

const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "niedz"];

export function CalendarView() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const { data: lessons = [], isLoading } = trpc.lessons.range.useQuery({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });

  const lessonsByDay = useMemo(() => {
    const map = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const key = format(new Date(lesson.startsAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(lesson);
      map.set(key, list);
    }
    return map;
  }, [lessons]);

  function openCreateDialog(day: Date) {
    setSelectedDate(day);
    setEditingLessonId(null);
    setDialogOpen(true);
  }

  function openEditDialog(day: Date, lessonId: string) {
    setSelectedDate(day);
    setEditingLessonId(lessonId);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h1 className="w-40 text-center text-lg font-semibold capitalize">
            {format(month, "LLLL yyyy", { locale: pl })}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          onClick={() => openCreateDialog(new Date())}
          className="bg-brand-gradient text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Dodaj zajęcia
        </Button>
      </div>

      <div className="bg-border text-muted-foreground grid grid-cols-7 gap-px overflow-hidden rounded-lg border text-xs font-medium">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-background px-2 py-1 text-center capitalize">
            {day}
          </div>
        ))}
      </div>

      <div className="bg-border grid grid-cols-7 gap-px overflow-hidden rounded-lg border">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayLessons = lessonsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "bg-background flex min-h-28 flex-col gap-1 p-1.5",
                !isSameMonth(day, month) && "bg-muted/40 text-muted-foreground",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs",
                    isToday(day) && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <button
                  onClick={() => openCreateDialog(day)}
                  className="text-muted-foreground hover:text-foreground opacity-0 focus:opacity-100 group-hover:opacity-100"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {dayLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => openEditDialog(day, lesson.id)}
                    className={cn(
                      "flex flex-col rounded px-1.5 py-1 text-left text-[11px] leading-tight",
                      lesson.status === "cancelled"
                        ? "bg-muted text-muted-foreground line-through"
                        : lesson.paid
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
                    )}
                  >
                    <span className="font-medium">
                      {format(new Date(lesson.startsAt), "HH:mm")} {lesson.student?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {formatPLN(lesson.price)}
                      {lesson.status === "completed" && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                          odbyte
                        </Badge>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}

      <LessonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        lessonId={editingLessonId}
        allLessons={lessons}
      />
    </div>
  );
}
