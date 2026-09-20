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
  Ban,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LineChart,
  CircleAlert,
  Clock3,
  Hourglass,
  Landmark,
  Palmtree,
  ListChecks,
  Plus,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
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
  paid: "bg-success/12",
  awaiting: "bg-warning/12",
  overdue: "bg-warning/12",
  cancelled: "bg-muted/60",
  cancelledPaid: "bg-muted/60",
};

const TONE_TEXT: Record<LessonTone, string> = {
  upcoming: "text-muted-foreground",
  prepaid: "text-success",
  paid: "text-success",
  awaiting: "text-warning",
  overdue: "text-warning",
  cancelled: "text-muted-foreground",
  cancelledPaid: "text-muted-foreground",
};

const TONE_ICON: Record<LessonTone, LucideIcon> = {
  upcoming: Clock3,
  prepaid: Banknote,
  paid: CheckCircle2,
  awaiting: Hourglass,
  overdue: CircleAlert,
  cancelled: Ban,
  cancelledPaid: Ban,
};

const TONE_SHORT: Record<LessonTone, string> = {
  upcoming: "Zaplanowane",
  prepaid: "Przedpłata",
  paid: "Opłacone",
  awaiting: "Oczekuje",
  overdue: "Zaległa",
  cancelled: "Odwołane",
  cancelledPaid: "Odwoł. opłac.",
};

const TONE_CHIP: Record<LessonTone, string> = {
  upcoming: TONE_FILL.upcoming,
  prepaid: `${TONE_FILL.prepaid} ring-success ${RING}`,
  paid: TONE_FILL.paid,
  awaiting: TONE_FILL.awaiting,
  overdue: `${TONE_FILL.overdue} ring-destructive ${RING}`,
  cancelled: `${TONE_FILL.cancelled} opacity-70`,
  cancelledPaid: `${TONE_FILL.cancelledPaid} opacity-70 ring-success ${RING}`,
};

const TONE_SWATCH: Record<LessonTone, string> = {
  upcoming: TONE_FILL.upcoming,
  prepaid: `${TONE_FILL.prepaid} ring-success ${RING}`,
  paid: "bg-success/45",
  awaiting: "bg-warning/45",
  overdue: `bg-warning/45 ring-destructive ${RING}`,
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
              {days.map((day, dayIndex) => {
                const key = format(day, "yyyy-MM-dd");
                const dayLessons = lessonsByDay.get(key) ?? [];
                const isCurrentDay = isToday(day);
                const counted = dayLessons.filter((l) => !l.tone.startsWith("cancelled"));
                const dayTotal = counted.length
                  ? {
                      amount: counted.reduce((sum, l) => sum + l.price, 0),
                      settled: counted.every((l) => l.settled),
                    }
                  : null;
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
                      <span className="flex items-center">
                        <span
                          className={cn(
                            "text-[11px] font-semibold tabular-nums group-hover:hidden",
                            dayTotal === null
                              ? "text-muted-foreground/50"
                              : dayTotal.settled
                                ? "text-success"
                                : "text-warning",
                          )}
                        >
                          {dayTotal === null ? "–" : formatPLN(dayTotal.amount)}
                        </span>
                        <button
                          onClick={() => openCreateDialog(day)}
                          className="text-muted-foreground hover:text-foreground hover:bg-accent hidden rounded p-0.5 focus:block group-hover:block"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </span>
                    </div>
                    {vacation && (
                      <div
                        className={cn(
                          "-mx-2.5 flex h-5 items-center gap-1 overflow-hidden bg-[color-mix(in_oklab,var(--chart-5)_72%,black)] text-[10px] font-medium text-white",
                          vacation.isStart ? "ml-0 rounded-l-full pl-2" : "-ml-[11px]",
                          vacation.isEnd ? "mr-0 rounded-r-full pr-2" : "-mr-[11px]",
                        )}
                        title={vacation.note ?? "Urlop"}
                      >
                        {(vacation.isStart || dayIndex % 7 === 0) && (
                          <>
                            <Palmtree
                              className={cn(
                                "size-3 shrink-0",
                                !vacation.isStart && "ml-2.5",
                              )}
                            />
                            <span className="truncate">{vacation.note ?? "Urlop"}</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {dayLessons.map((lesson) => {
                        const ToneIcon = TONE_ICON[lesson.tone];
                        const struck = lesson.tone.startsWith("cancelled");
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => openEditDialog(day, lesson.id)}
                            title={`${LESSON_TONE_LABELS[lesson.tone]} — ${LESSON_TONE_HINTS[lesson.tone]}`}
                            className={cn(
                              "flex flex-col gap-0.5 rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                              TONE_CHIP[lesson.tone],
                            )}
                          >
                            <span className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  "font-semibold tabular-nums",
                                  TONE_TEXT[lesson.tone],
                                  struck && "line-through",
                                )}
                              >
                                {format(new Date(lesson.startsAt), "HH:mm")}
                              </span>
                              <ToneIcon
                                className={cn("size-3 shrink-0", TONE_TEXT[lesson.tone])}
                              />
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1 truncate font-medium",
                                struck
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground",
                              )}
                            >
                              <span className="truncate">{lesson.student?.name}</span>
                              {lesson.mode === "remote" && (
                                <Video className="size-2.5 shrink-0" />
                              )}
                            </span>
                            <span
                              className={cn(
                                "truncate font-medium tabular-nums",
                                TONE_TEXT[lesson.tone],
                              )}
                            >
                              {formatPLN(lesson.price)} · {TONE_SHORT[lesson.tone]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}
        </div>

        <div className="flex flex-col gap-5 lg:col-span-4">
          <StatsPromoCard />
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

function StatsPromoCard() {
  return (
    <Link
      href="/dashboard/stats"
      className="bg-brand-gradient group/promo focus-visible:ring-ring flex items-center gap-3 rounded-xl p-4 text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <LineChart className="size-4.5" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold">Finanse i statystyki</span>
        <span className="text-xs text-white/75">
          Przychody, prognoza i zaległości w jednym miejscu
        </span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 transition-transform group-hover/promo:translate-x-0.5" />
    </Link>
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
          <span className="h-2.5 w-5 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--chart-5)_72%,black)]" />
          <span className="text-muted-foreground">Urlop</span>
        </span>
      </div>
    </Card>
  );
}
