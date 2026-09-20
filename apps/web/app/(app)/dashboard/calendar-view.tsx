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
import {
  AlertCircle,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ListChecks,
  Plus,
  Video,
} from "lucide-react";
import type { AppRouter } from "@repo/api";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatPLN,
  LESSON_TONE_HINTS,
  LESSON_TONE_LABELS,
  type LessonTone,
} from "@repo/shared";
import { trackLessonCheckedOff } from "@repo/analytics";
import { flowDeps } from "@/lib/analytics";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { LessonDialog } from "./lesson-dialog";
import { VacationNoticesPanel } from "./vacations/notice-panel";

const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "niedz"];

type LessonRow = inferRouterOutputs<AppRouter>["lessons"]["range"][number];

const TONE_ORDER: LessonTone[] = [
  "upcoming",
  "prepaid",
  "awaiting",
  "overdue",
  "paid",
  "cancelled",
  "cancelledPaid",
];

const RING = "ring-2 ring-offset-2 ring-offset-card";

const TONE_FILL: Record<LessonTone, string> = {
  upcoming: "bg-secondary",
  prepaid: "bg-secondary",
  paid: "bg-success/45",
  awaiting: "bg-warning/45",
  overdue: "bg-warning/45",
  cancelled: "bg-muted/70",
  cancelledPaid: "bg-muted/70",
};

const TONE_CHIP: Record<LessonTone, string> = {
  upcoming: `${TONE_FILL.upcoming} text-foreground`,
  prepaid: `${TONE_FILL.prepaid} text-foreground ring-success ${RING}`,
  paid: `${TONE_FILL.paid} text-foreground`,
  awaiting: `${TONE_FILL.awaiting} text-foreground`,
  overdue: `${TONE_FILL.overdue} text-foreground ring-destructive ${RING}`,
  cancelled: `${TONE_FILL.cancelled} text-muted-foreground line-through opacity-70`,
  cancelledPaid: `${TONE_FILL.cancelledPaid} text-muted-foreground line-through ring-success ${RING}`,
};

const TONE_SWATCH: Record<LessonTone, string> = {
  upcoming: TONE_FILL.upcoming,
  prepaid: `${TONE_FILL.prepaid} ring-success ${RING}`,
  paid: TONE_FILL.paid,
  awaiting: TONE_FILL.awaiting,
  overdue: `${TONE_FILL.overdue} ring-destructive ${RING}`,
  cancelled: `${TONE_FILL.cancelled} opacity-70`,
  cancelledPaid: `${TONE_FILL.cancelledPaid} ring-success ${RING}`,
};

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

  const today = useMemo(() => new Date(), []);
  const { data: vacationOverview } = trpc.vacations.overview.useQuery({
    today: format(today, "yyyy-MM-dd"),
  });
  const pendingNotices = vacationOverview?.pending ?? [];

  const vacationByDay = useMemo(() => {
    const map = new Map<
      string,
      { note: string | null; isStart: boolean; isEnd: boolean }
    >();
    for (const vacation of vacationOverview?.vacations ?? []) {
      for (const day of eachDayOfInterval({
        start: new Date(`${vacation.startDate}T12:00:00`),
        end: new Date(`${vacation.endDate}T12:00:00`),
      })) {
        const dayKey = format(day, "yyyy-MM-dd");
        map.set(dayKey, {
          note: vacation.note,
          isStart: dayKey === vacation.startDate,
          isEnd: dayKey === vacation.endDate,
        });
      }
    }
    return map;
  }, [vacationOverview]);
  const actionLessons = useMemo(() => {
    const rank = (l: LessonRow) => {
      if (l.tone === "overdue") return 0;
      if (l.status !== "completed" && new Date(l.endsAt) <= today) return 1;
      if (isSameDay(new Date(l.startsAt), today)) return 2;
      return 3;
    };
    return lessons
      .filter((l) => {
        if (actionStepOf(l) === null) return false;
        if (l.tone === "overdue") return true;
        if (new Date(l.endsAt) <= today) return true;
        return isSameDay(new Date(l.startsAt), today);
      })
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [lessons, today]);

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
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-8">
          <Card className="flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
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
            <Button onClick={() => openCreateDialog(new Date())}>
              <Plus className="size-4" />
              Dodaj zajęcia
            </Button>
          </Card>

          <div className="border-border-solid overflow-hidden rounded-xl border">
            <div className="bg-secondary text-muted-foreground grid grid-cols-7 text-xs font-semibold">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-2 text-center capitalize">
                  {day}
                </div>
              ))}
            </div>

            <div className="bg-border-solid grid grid-cols-7 gap-px">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayLessons = lessonsByDay.get(key) ?? [];
                const isCurrentDay = isToday(day);
                const vacation = vacationByDay.get(key);
                return (
                  <div
                    key={key}
                    className={cn(
                      "bg-card group relative flex min-h-28 flex-col gap-1.5 p-2.5",
                      !isSameMonth(day, month) &&
                        "bg-background/60 text-muted-foreground",
                      isCurrentDay && "bg-primary/[0.06]",
                    )}
                  >
                    {isCurrentDay && (
                      <div className="bg-primary absolute inset-x-0 top-0 h-0.5" />
                    )}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          isCurrentDay && "bg-primary text-primary-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <button
                        onClick={() => openCreateDialog(day)}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-0.5 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    {vacation && (
                      <div
                        className={cn(
                          "bg-chart-5 -mx-2.5 h-1.5",
                          vacation.isStart ? "ml-0 rounded-l-full" : "-ml-[11px]",
                          vacation.isEnd ? "mr-0 rounded-r-full" : "-mr-[11px]",
                        )}
                        title={vacation.note ?? "Urlop"}
                      />
                    )}

                    <div className="flex flex-col gap-3">
                      {dayLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => openEditDialog(day, lesson.id)}
                          title={`${LESSON_TONE_LABELS[lesson.tone]} — ${LESSON_TONE_HINTS[lesson.tone]}`}
                          className={cn(
                            "flex flex-col rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                            TONE_CHIP[lesson.tone],
                          )}
                        >
                          <span className="font-medium">
                            {format(new Date(lesson.startsAt), "HH:mm")}{" "}
                            {lesson.student?.name}
                            {lesson.mode === "remote" && (
                              <Video className="ml-1 inline size-2.5 align-baseline" />
                            )}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            {formatPLN(lesson.price)}
                            {lesson.status === "completed" && (
                              <Banknote className="text-muted-foreground size-2.5" />
                            )}
                            {lesson.tone === "overdue" && (
                              <AlertCircle className="text-destructive ml-auto size-3" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}
        </div>

        <div className="flex flex-col gap-5 lg:col-span-4">
          {pendingNotices.length > 0 && <VacationNoticesPanel pending={pendingNotices} />}
          <ActionPanel
            lessons={actionLessons}
            onOpen={(day, id) => openEditDialog(day, id)}
          />
          <CalendarLegend />
        </div>
      </div>

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

type ActionStep = "confirm" | "settle";

function actionStepOf(lesson: LessonRow): ActionStep | null {
  if (lesson.status === "cancelled" || lesson.vacationId) return null;
  if (lesson.settled) return null;
  if (lesson.status !== "completed") return "confirm";
  return lesson.paymentState === "awaiting_payout" ? null : "settle";
}

function ActionPanel({
  lessons,
  onOpen,
}: {
  lessons: LessonRow[];
  onOpen: (day: Date, id: string) => void;
}) {
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };
  const markCompleted = trpc.lessons.update.useMutation({
    onSuccess: (_result, variables) => {
      const lesson = lessons.find((l) => l.id === variables.id);
      trackLessonCheckedOff(flowDeps, {
        lessonId: variables.id,
        status: "completed",
        scheduledAt: lesson?.createdAt,
      });
      invalidate();
    },
  });
  const markPaid = trpc.lessons.update.useMutation({ onSuccess: invalidate });
  const pending = markCompleted.isPending || markPaid.isPending;

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="text-warning size-4" />
          <h2 className="text-sm font-semibold">Do zrobienia</h2>
        </div>
        <Badge variant="secondary">{lessons.length}</Badge>
      </div>
      {lessons.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Wszystko odhaczone i rozliczone. 🎉
        </p>
      )}
      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => {
          const step = actionStepOf(lesson);
          return (
            <div
              key={lesson.id}
              className="border-border-solid flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <button
                onClick={() => onOpen(new Date(lesson.startsAt), lesson.id)}
                className="flex flex-1 flex-col items-start text-left"
              >
                <span className="text-sm font-medium">{lesson.student?.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {isToday(new Date(lesson.startsAt))
                    ? format(new Date(lesson.startsAt), "'dziś' HH:mm")
                    : format(new Date(lesson.startsAt), "d MMM, HH:mm", {
                        locale: pl,
                      })}{" "}
                  · {formatPLN(step === "settle" ? lesson.amountDue : lesson.price)}
                </span>
              </button>

              {step === "confirm" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    markCompleted.mutate({ id: lesson.id, status: "completed" })
                  }
                >
                  <Check className="size-3.5" />
                  Odbyły się
                </Button>
              )}

              {step === "settle" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" disabled={pending}>
                      Rozlicz
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        markPaid.mutate({
                          id: lesson.id,
                          paid: true,
                          paymentMethod: "cash",
                        })
                      }
                    >
                      <Banknote className="size-4" />
                      Gotówka
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        markPaid.mutate({
                          id: lesson.id,
                          paid: true,
                          paymentMethod: "transfer",
                        })
                      }
                    >
                      <Landmark className="size-4" />
                      Przelew
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CalendarLegend() {
  return (
    <Card className="gap-2 px-4 py-3">
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        Legenda
      </span>
      <div className="flex flex-wrap gap-x-5 gap-y-3.5">
        {TONE_ORDER.map((tone) => (
          <span
            key={tone}
            className="flex items-center gap-2.5 text-xs"
            title={LESSON_TONE_HINTS[tone]}
          >
            <span className={cn("size-3 shrink-0 rounded-sm", TONE_SWATCH[tone])} />
            <span
              className={cn(
                "text-muted-foreground",
                tone.startsWith("cancelled") && "line-through",
              )}
            >
              {LESSON_TONE_LABELS[tone]}
            </span>
          </span>
        ))}
        <span className="flex items-center gap-2.5 text-xs">
          <span className="bg-chart-5 h-1.5 w-5 shrink-0 rounded-full" />
          <span className="text-muted-foreground">Urlop</span>
        </span>
      </div>
    </Card>
  );
}
