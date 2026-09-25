"use client";

import {
  addDays,
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
  ChevronDown,
  ChevronLeft,
  Info,
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
import { CollapsibleCard } from "@/components/collapsible-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PageHeader } from "./page-header";
import { VacationNoticesPanel } from "./vacations/notice-panel";

const NOTICE_LEAD_DAYS = 14;

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
  const pendingNotices = useMemo(() => {
    const horizon = format(addDays(today, NOTICE_LEAD_DAYS), "yyyy-MM-dd");
    return (vacationOverview?.pending ?? []).filter((n) => n.startDate <= horizon);
  }, [vacationOverview, today]);

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
      if (new Date(l.endsAt) <= today) return 1;
      if (isSameDay(new Date(l.startsAt), today)) return 2;
      return 3;
    };
    return lessons
      .filter((l) => {
        if (!needsAction(l)) return false;
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
      <PageHeader
        title={
          <span className="capitalize">{format(month, "LLLL yyyy", { locale: pl })}</span>
        }
        description="Kalendarz lekcji. Kliknij dzień, żeby dodać zajęcia."
        actions={
          <>
            <div className="bg-card ring-foreground/10 flex items-center gap-0.5 rounded-lg p-0.5 ring-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Poprzedni miesiąc"
                onClick={() => setMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSameMonth(month, today)}
                onClick={() => setMonth(new Date())}
              >
                Dziś
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Następny miesiąc"
                onClick={() => setMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button onClick={() => openCreateDialog(new Date())}>
              <Plus className="size-4" />
              Dodaj zajęcia
            </Button>
          </>
        }
      />

      <MonthSummary month={month} />

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-8">
          <div className="border-border-solid overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgb(21_25_53/0.04),0_14px_30px_-22px_rgb(21_25_53/0.4)]">
            <div className="bg-secondary text-muted-foreground grid grid-cols-7 text-[11px] font-semibold uppercase tracking-[0.08em]">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-2.5 text-center">
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
                            "text-[11px] font-semibold tabular-nums group-hover:hidden max-sm:hidden",
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

function isSchoolLesson(lesson: LessonRow) {
  return lesson.paymentState === "awaiting_payout";
}

function needsAction(lesson: LessonRow) {
  if (lesson.status === "cancelled" || lesson.vacationId) return false;
  if (lesson.status !== "completed") return true;
  return !lesson.settled && !isSchoolLesson(lesson);
}

const PAYMENT_METHOD_LABELS = { cash: "gotówka", transfer: "przelew" } as const;

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
  const setCompleted = trpc.lessons.update.useMutation({
    onSuccess: (_result, variables) => {
      if (variables.status === "completed") {
        const lesson = lessons.find((l) => l.id === variables.id);
        trackLessonCheckedOff(flowDeps, {
          lessonId: variables.id,
          status: "completed",
          scheduledAt: lesson?.createdAt,
        });
      }
      invalidate();
    },
  });
  const setPaid = trpc.lessons.update.useMutation({ onSuccess: invalidate });
  const pending = setCompleted.isPending || setPaid.isPending;

  return (
    <CollapsibleCard
      id="action-panel"
      title="Do zrobienia"
      icon={<ListChecks className="text-warning size-4" />}
      aside={<Badge variant="secondary">{lessons.length}</Badge>}
    >
      {lessons.length === 0 && (
        <p className="font-hand text-success text-[22px] leading-tight">
          Wszystko odhaczone i rozliczone ✓
        </p>
      )}
      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => {
          const completed = lesson.status === "completed";
          const school = isSchoolLesson(lesson);
          return (
            <div
              key={lesson.id}
              className="border-border-solid flex flex-col gap-2 rounded-lg border px-3 py-2"
            >
              <button
                onClick={() => onOpen(new Date(lesson.startsAt), lesson.id)}
                className="flex flex-col items-start text-left"
              >
                <span className="text-sm font-medium">{lesson.student?.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {isToday(new Date(lesson.startsAt))
                    ? format(new Date(lesson.startsAt), "'dziś' HH:mm")
                    : format(new Date(lesson.startsAt), "d MMM, HH:mm", {
                        locale: pl,
                      })}{" "}
                  · {formatPLN(lesson.settled ? lesson.price : lesson.amountDue)}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={completed ? "secondary" : "outline"}
                  disabled={pending}
                  className={cn(completed && "text-success")}
                  onClick={() =>
                    setCompleted.mutate({
                      id: lesson.id,
                      status: completed ? "scheduled" : "completed",
                    })
                  }
                >
                  <Check className={cn("size-3.5", !completed && "opacity-30")} />
                  Odbyte
                </Button>

                {school ? (
                  <span className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                    <Landmark className="size-3.5" />
                    Wypłata ze szkółki
                  </span>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant={lesson.settled ? "secondary" : "outline"}
                        disabled={pending}
                        className={cn(lesson.settled && "text-success")}
                      >
                        <Banknote
                          className={cn("size-3.5", !lesson.settled && "opacity-30")}
                        />
                        {lesson.settled && lesson.paid && lesson.paymentMethod
                          ? `Opłacone · ${PAYMENT_METHOD_LABELS[lesson.paymentMethod]}`
                          : "Opłacone"}
                        <ChevronDown className="size-3.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setPaid.mutate({
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
                          setPaid.mutate({
                            id: lesson.id,
                            paid: true,
                            paymentMethod: "transfer",
                          })
                        }
                      >
                        <Landmark className="size-4" />
                        Przelew
                      </DropdownMenuItem>
                      {lesson.paid && (
                        <DropdownMenuItem
                          onClick={() =>
                            setPaid.mutate({
                              id: lesson.id,
                              paid: false,
                              paymentMethod: null,
                            })
                          }
                        >
                          <Ban className="size-4" />
                          Nieopłacone
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleCard>
  );
}

function MonthSummary({ month }: { month: Date }) {
  const { data, isLoading } = trpc.stats.summary.useQuery({
    from: startOfMonth(month).toISOString(),
    to: endOfMonth(month).toISOString(),
  });

  const paid = data?.paid ?? 0;
  const unpaid = data?.unpaid ?? 0;
  const payout = data?.awaitingPayout ?? 0;
  const planned = Math.max(0, (data?.theoretical ?? 0) - paid - unpaid - payout);
  const total = paid + unpaid + payout + planned;
  const lessonCount = (data?.completedCount ?? 0) + (data?.scheduledCount ?? 0);

  const parts = [
    {
      key: "paid",
      label: "Opłacone",
      value: paid,
      text: "text-success",
      bar: "bg-success",
    },
    {
      key: "unpaid",
      label: "Do zapłaty",
      value: unpaid,
      text: "text-warning",
      bar: "bg-warning",
    },
    ...(payout > 0
      ? [
          {
            key: "payout",
            label: "Do wypłaty ze szkółek",
            value: payout,
            text: "text-foreground",
            bar: "bg-chart-5",
          },
        ]
      : []),
    {
      key: "planned",
      label: "Zaplanowane",
      value: planned,
      text: "text-foreground",
      bar: "bg-muted-foreground/35",
    },
  ];

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10">
          {parts.map((part) => (
            <div key={part.key} className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                <span className={cn("size-2 rounded-full", part.bar)} />
                {part.label}
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums tracking-tight",
                    part.text,
                  )}
                >
                  {formatPLN(part.value)}
                </span>
              )}
            </div>
          ))}
        </div>
        {lessonCount > 0 && (
          <span className="text-muted-foreground text-sm tabular-nums">
            Odbyte: {data?.completedCount ?? 0} z {lessonCount}
          </span>
        )}
      </div>
      <div className="bg-secondary flex h-2 gap-0.5 overflow-hidden rounded-full">
        {total > 0 &&
          parts.map(
            (part) =>
              part.value > 0 && (
                <span
                  key={part.key}
                  className={cn("h-full transition-[width] duration-700", part.bar)}
                  style={{ width: `${(part.value / total) * 100}%` }}
                />
              ),
          )}
      </div>
    </Card>
  );
}

function StatsPromoCard() {
  return (
    <Link
      href="/dashboard/stats"
      className="group/promo bg-inverse text-inverse-foreground ring-inverse-border focus-visible:ring-ring flex items-center gap-3 rounded-2xl p-4 ring-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
    >
      <span className="bg-inverse-foreground/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
        <LineChart className="size-4.5" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold">Finanse i statystyki</span>
        <span className="text-inverse-foreground/70 text-xs">
          Przychody, prognoza i zaległości w jednym miejscu
        </span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 transition-transform group-hover/promo:translate-x-0.5" />
    </Link>
  );
}

function CalendarLegend() {
  return (
    <CollapsibleCard
      id="calendar-legend"
      title="Legenda"
      icon={<Info className="text-muted-foreground size-4" />}
    >
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
    </CollapsibleCard>
  );
}
