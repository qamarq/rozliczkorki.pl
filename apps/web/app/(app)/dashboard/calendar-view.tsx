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
  Banknote,
  CalendarClock,
  CalendarX2,
  Check,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ListChecks,
  Plus,
  Sparkles,
  Video,
  Wallet,
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
import { formatPLN } from "@repo/shared";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { LessonDialog } from "./lesson-dialog";
import { VacationNoticesPanel } from "./vacations/notice-panel";

const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "niedz"];

type LessonRow = inferRouterOutputs<AppRouter>["lessons"]["range"][number];

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

  const { data: summary } = trpc.stats.summary.useQuery({
    from: startOfMonth(month).toISOString(),
    to: endOfMonth(month).toISOString(),
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

  const today = new Date();
  const { data: vacationOverview } = trpc.vacations.overview.useQuery({
    today: format(today, "yyyy-MM-dd"),
  });
  const pendingNotices = vacationOverview?.pending ?? [];
  const todayLessons = useMemo(
    () =>
      lessons
        .filter((l) => isSameDay(new Date(l.startsAt), today) && l.status !== "cancelled")
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [lessons],
  );

  const dueLessons = useMemo(
    () =>
      lessons
        .filter((l) => l.status === "completed" && !l.settled)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .slice(0, 6),
    [lessons],
  );

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="Potencjał miesiąca"
          value={formatPLN(summary?.theoretical ?? 0)}
          tone="primary"
        />
        <StatCard
          icon={Wallet}
          label="Otrzymane środki"
          value={formatPLN(summary?.paid ?? 0)}
          tone="success"
        />
        <StatCard
          icon={CalendarClock}
          label="Do rozliczenia"
          value={formatPLN(summary?.unpaid ?? 0)}
          tone="warning"
        />
        <StatCard
          icon={CalendarX2}
          label="Odwołane zajęcia"
          value={String(summary?.cancelledCount ?? 0)}
          tone="destructive"
        />
      </div>

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
                return (
                  <div
                    key={key}
                    className={cn(
                      "bg-card group relative flex min-h-28 flex-col gap-1 p-1.5",
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
                    <div className="flex flex-col gap-1">
                      {dayLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => openEditDialog(day, lesson.id)}
                          className={cn(
                            "flex flex-col rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
                            lesson.vacationId
                              ? "bg-muted border-muted-foreground/40 text-muted-foreground line-through opacity-70"
                              : lesson.status === "cancelled"
                                ? "bg-destructive/10 border-destructive/50 text-muted-foreground line-through"
                                : lesson.settled
                                  ? "bg-success/10 border-success text-foreground"
                                  : "bg-warning/10 border-warning text-foreground",
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
          <TodayPanel lessons={todayLessons} onOpen={(id) => openEditDialog(today, id)} />
          <DuePanel lessons={dueLessons} onOpen={(day, id) => openEditDialog(day, id)} />
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

function TodayPanel({
  lessons,
  onOpen,
}: {
  lessons: LessonRow[];
  onOpen: (id: string) => void;
}) {
  const utils = trpc.useUtils();
  const markCompleted = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      utils.stats.analytics.invalidate();
    },
  });
  const markPaid = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      utils.stats.analytics.invalidate();
    },
  });

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dzisiejsze zajęcia</h2>
        <Badge variant="secondary">{lessons.length}</Badge>
      </div>
      {lessons.length === 0 && (
        <p className="text-muted-foreground text-sm">Brak zajęć zaplanowanych na dziś.</p>
      )}
      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border-border-solid flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
          >
            <button
              onClick={() => onOpen(lesson.id)}
              className="flex flex-1 flex-col items-start text-left"
            >
              <span className="text-sm font-medium">
                {format(new Date(lesson.startsAt), "HH:mm")} {lesson.student?.name}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatPLN(lesson.price)}
              </span>
            </button>
            {lesson.status === "scheduled" && (
              <Button
                size="sm"
                variant="outline"
                disabled={markCompleted.isPending}
                onClick={() =>
                  markCompleted.mutate({ id: lesson.id, status: "completed" })
                }
              >
                <Check className="size-3.5" />
                Odbyta
              </Button>
            )}
            {lesson.status === "completed" && !lesson.settled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={markPaid.isPending}>
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
            {lesson.status === "completed" && lesson.settled && (
              <Badge className="bg-success/10 text-success border-success/20">
                Opłacone
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DuePanel({
  lessons,
  onOpen,
}: {
  lessons: LessonRow[];
  onOpen: (day: Date, id: string) => void;
}) {
  const utils = trpc.useUtils();
  const markPaid = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      utils.stats.analytics.invalidate();
    },
  });

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center gap-2">
        <ListChecks className="text-warning size-4" />
        <h2 className="text-sm font-semibold">Oczekują na rozliczenie</h2>
      </div>
      {lessons.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Wszystkie odbyte zajęcia są rozliczone. 🎉
        </p>
      )}
      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border-warning/30 bg-warning/5 flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
          >
            <button
              onClick={() => onOpen(new Date(lesson.startsAt), lesson.id)}
              className="flex flex-1 flex-col items-start text-left"
            >
              <span className="text-sm font-medium">{lesson.student?.name}</span>
              <span className="text-muted-foreground text-xs">
                {format(new Date(lesson.startsAt), "d MMM, HH:mm", { locale: pl })} ·{" "}
                {formatPLN(lesson.amountDue)}
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={markPaid.isPending}>
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
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "destructive";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            toneClasses,
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </Card>
  );
}
