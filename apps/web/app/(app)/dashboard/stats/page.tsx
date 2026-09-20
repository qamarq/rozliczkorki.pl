"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPLN, pluralize } from "@repo/shared";
import { trackFinancialSummaryViewed } from "@repo/analytics";
import { flowDeps } from "@/lib/analytics";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { TrendChart, type TrendPoint } from "./charts";
import {
  buildBuckets,
  granularityFor,
  type PresetId,
  presetRange,
  previousRange,
  type Range,
} from "@repo/shared";
import { RangePicker } from "./range-picker";

const GRANULARITY_LABEL = {
  day: "dziennie",
  week: "tygodniowo",
  month: "miesięcznie",
} as const;

const shortPLN = (value: number) =>
  Math.abs(value) >= 1000
    ? `${Math.round(value / 100) / 10} tys.`
    : String(Math.round(value));

export default function StatsPage() {
  const now = useMemo(() => new Date(), []);
  const [preset, setPreset] = useState<PresetId | null>("this-month");
  const [range, setRange] = useState<Range>(() => presetRange("this-month", now));

  const granularity = granularityFor(range);
  const buckets = useMemo(() => buildBuckets(range, granularity), [range, granularity]);
  const compare = useMemo(() => {
    const previous = previousRange(range);
    return { from: previous.from.toISOString(), to: previous.to.toISOString() };
  }, [range]);
  const compareBuckets = useMemo(
    () => buildBuckets(previousRange(range), granularity),
    [range, granularity],
  );

  const { data, isLoading } = trpc.stats.analytics.useQuery({
    buckets,
    compare,
    compareBuckets,
    now: now.toISOString(),
  });

  const totals = data?.totals;

  const reported = useRef(false);
  useEffect(() => {
    if (!totals || reported.current) return;
    reported.current = true;
    void trackFinancialSummaryViewed(flowDeps, {
      viewType: "full_summary",
      overdueLessonsCount: totals.unpaidLessons,
      dueLessonsCount: totals.awaitingPayoutLessons,
      earnedAmount: totals.paid,
      dueAmount: totals.awaitingPayout,
      overdueAmount: totals.unpaid,
    });
  }, [totals]);

  const points = useMemo(() => {
    const current = data?.series ?? [];
    const previous = data?.compareSeries ?? [];
    const lastPast = current.reduce((acc, b, i) => (b.isPast ? i : acc), -1);
    const round2 = (value: number) => Math.round(value * 100) / 100;
    let running = 0;
    let runningPrev = 0;
    const result: TrendPoint[] = [];
    for (const [i, bucket] of current.entries()) {
      running += bucket.revenue;
      runningPrev += previous[i]?.revenue ?? 0;
      result.push({
        label: bucket.label,
        actual: bucket.isPast ? round2(running) : null,
        forecast: !bucket.isPast || i === lastPast ? round2(running) : null,
        previous: previous.length ? round2(runningPrev) : null,
      });
    }
    return result;
  }, [data]);

  const formatMetric = (value: number) => formatPLN(value);
  const formatAxis = (value: number) => shortPLN(value);

  const revenueDelta = delta(totals?.billed, data?.compare?.billed);
  const bar = [
    { key: "paid", label: "Opłacone", value: totals?.paid ?? 0, className: "bg-success" },
    {
      key: "awaiting",
      label: "Do wypłaty",
      value: totals?.awaitingPayout ?? 0,
      className: "bg-warning",
    },
    {
      key: "unpaid",
      label: "Zaległe",
      value: totals?.unpaid ?? 0,
      className: "bg-destructive",
    },
    {
      key: "planned",
      label: "Zaplanowane",
      value: (totals?.planned ?? 0) + (totals?.projected ?? 0),
      className: "bg-primary-foreground/40",
    },
  ];
  const barTotal = bar.reduce((sum, part) => sum + part.value, 0) || 1;
  const lessonsTotal = (totals?.lessonCount ?? 0) + (totals?.projectedLessons ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Statystyki</h1>
          <p className="text-muted-foreground text-sm">
            Przychody, obłożenie i prognoza dla dowolnego zakresu dat.
          </p>
        </div>
        <RangePicker
          range={range}
          preset={preset}
          now={now}
          onChange={(next, nextPreset) => {
            setRange(next);
            setPreset(nextPreset);
          }}
        />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-12">
        <Card className="text-primary-foreground justify-between gap-6 bg-[color-mix(in_oklab,var(--primary)_72%,black)] p-5 lg:col-span-4">
          <div className="flex flex-col gap-2">
            <span className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wide">
              Przychód w okresie
            </span>
            {isLoading ? (
              <Skeleton className="bg-primary-foreground/20 h-9 w-40" />
            ) : (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {formatPLN(totals?.expected ?? 0)}
                </span>
                {revenueDelta !== null && (
                  <span className="flex items-center gap-0.5 text-sm font-medium">
                    {revenueDelta >= 0 ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    {Math.abs(revenueDelta)}%
                  </span>
                )}
              </div>
            )}
            <span className="text-primary-foreground/70 text-xs">
              {(totals?.projected ?? 0) > 0
                ? `w tym ${formatPLN(totals?.projected ?? 0)} prognozy z zajęć cyklicznych`
                : "w porównaniu z poprzednim okresem tej samej długości"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-primary-foreground/15 flex h-2 gap-0.5 overflow-hidden rounded-full">
              {bar.map((part) => (
                <span
                  key={part.key}
                  className={cn(
                    "first:rounded-l-full last:rounded-r-full",
                    part.className,
                  )}
                  style={{ width: `${(part.value / barTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {bar.map((part) => (
                <div key={part.key} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2 rounded-full", part.className)} />
                  <span className="text-primary-foreground/70">{part.label}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatPLN(part.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="gap-4 p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-semibold">Trend</span>
              <span className="text-muted-foreground text-xs">
                {GRANULARITY_LABEL[granularity]} · narastająco
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-chart-1 h-0.5 w-5 rounded-full" />
                <span className="text-muted-foreground">Ten okres</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="border-chart-1 w-5 border-t-2 border-dashed" />
                <span className="text-muted-foreground">Prognoza</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="border-success w-5 border-t-2 border-dashed" />
                <span className="text-muted-foreground">Poprzedni okres</span>
              </span>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TrendChart
              data={points}
              formatValue={formatMetric}
              formatAxis={formatAxis}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Zajęcia"
          value={String(lessonsTotal)}
          delta={delta(totals?.lessonCount, data?.compare?.lessonCount)}
          sub={`${totals?.completed ?? 0} odbytych · ${totals?.cancelled ?? 0} odwołanych (${totals?.cancellationRate ?? 0}%)`}
        />
        <Tile
          label="Godziny"
          value={`${totals?.hours ?? 0} h`}
          delta={delta(totals?.hours, data?.compare?.hours)}
          sub={`${pluralize(totals?.activeStudents ?? 0, "uczeń", "uczniów", "uczniów")} w okresie`}
        />
        <Tile
          label="Stawka efektywna"
          value={`${formatPLN(totals?.effectiveHourlyRate ?? 0)}/h`}
          delta={delta(totals?.effectiveHourlyRate, data?.compare?.effectiveHourlyRate)}
          sub="Przychód podzielony przez godziny"
        />
        <Tile
          label="Ściągalność"
          value={`${totals?.collectionRate ?? 0}%`}
          sub={`Zaległości ogółem ${formatPLN(data?.debt.outstanding ?? 0)}`}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <Card className="gap-0 p-0 lg:col-span-7">
          <div className="flex items-center justify-between gap-2 px-5 py-4">
            <span className="font-semibold">Uczniowie</span>
            <span className="text-muted-foreground text-xs">
              Rozliczenie w wybranym okresie
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Uczeń</TableHead>
                  <TableHead className="text-right">Zajęcia</TableHead>
                  <TableHead className="text-right">Przychód</TableHead>
                  <TableHead className="w-40 pr-5">Rozliczenie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.byStudent ?? []).map((student) => {
                  const ratio =
                    student.billed > 0
                      ? Math.min(100, Math.round((student.paid / student.billed) * 100))
                      : 0;
                  return (
                    <TableRow key={student.studentId}>
                      <TableCell className="pl-5">
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {student.hours} h{student.type === "school" && " · szkoła"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {student.lessonCount}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPLN(student.billed)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                ratio === 100 ? "bg-success" : "bg-warning",
                              )}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                            {ratio}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && (data?.byStudent ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground py-10 text-center"
                    >
                      Brak zajęć w tym zakresie
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card className="gap-3 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">Zaległości uczniów</span>
              <span className="text-warning font-semibold tabular-nums">
                {formatPLN(data?.debt.outstanding ?? 0)}
              </span>
            </div>
            {(data?.debt.debtors ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Wszystko rozliczone, brak długów.
              </p>
            ) : (
              <div className="flex flex-col">
                {(data?.debt.debtors ?? []).slice(0, 6).map((debtor) => (
                  <div
                    key={debtor.studentId}
                    className="flex items-center justify-between gap-2 border-b py-2 text-sm last:border-0"
                  >
                    <span>{debtor.name}</span>
                    <span className="font-medium tabular-nums">
                      {formatPLN(debtor.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Info className="size-3.5 shrink-0" />
              Ze wszystkich zajęć, które już się odbyły, nie tylko z tego zakresu.
            </p>
          </Card>

          <Card className="gap-3 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">Do wypłaty ze szkółek</span>
              <span className="text-warning font-semibold tabular-nums">
                {formatPLN(data?.payouts.awaiting ?? 0)}
              </span>
            </div>
            {(data?.payouts.schools ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Brak zajęć czekających na przelew ze szkółki.
              </p>
            ) : (
              <div className="flex flex-col">
                {(data?.payouts.schools ?? []).map((school) => (
                  <Link
                    key={school.schoolId}
                    href={`/dashboard/schools/${school.schoolId}`}
                    className="hover:bg-accent/40 flex items-center justify-between gap-2 border-b py-2 text-sm last:border-0"
                  >
                    <span>{school.name}</span>
                    <span className="font-medium tabular-nums">
                      {formatPLN(school.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Info className="size-3.5 shrink-0" />
              Zajęcia już się odbyły, ale przelew ze szkółki jeszcze nie przyszedł.
            </p>
          </Card>

          <Card className="gap-4 p-5">
            <span className="font-semibold">Struktura okresu</span>
            <Meter
              title="Tryb zajęć"
              label="Stacjonarne"
              secondaryLabel="Online"
              value={data?.splits.mode.in_person ?? 0}
              secondary={data?.splits.mode.remote ?? 0}
              format={(v) => pluralize(v, "zajęcie", "zajęcia", "zajęć")}
            />
            <Meter
              title="Płatności"
              label="Gotówka"
              secondaryLabel="Przelew"
              value={data?.splits.payment.cash ?? 0}
              secondary={data?.splits.payment.transfer ?? 0}
              format={formatPLN}
              note={
                (data?.splits.payment.unknown ?? 0) > 0
                  ? `Bez formy płatności: ${formatPLN(data?.splits.payment.unknown ?? 0)}`
                  : undefined
              }
            />
            <Meter
              title="Typ ucznia"
              label="Prywatni"
              secondaryLabel="Szkoła"
              value={data?.splits.type.private ?? 0}
              secondary={data?.splits.type.school ?? 0}
              format={formatPLN}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function delta(current?: number, previous?: number) {
  if (current == null || previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function Tile({
  label,
  value,
  sub,
  delta: change,
}: {
  label: string;
  value: string;
  sub: string;
  delta?: number | null;
}) {
  return (
    <Card className="gap-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
        {change != null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              change >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground truncate text-xs">{sub}</span>
    </Card>
  );
}

function Meter({
  title,
  label,
  secondaryLabel,
  value,
  secondary,
  format,
  note,
}: {
  title: string;
  label: string;
  secondaryLabel: string;
  value: number;
  secondary: number;
  format: (value: number) => string;
  note?: string;
}) {
  const total = value + secondary;
  const ratio = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{title}</span>
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <span className="bg-chart-1 h-full" style={{ width: `${ratio}%` }} />
        <span className="bg-chart-5/30 h-full flex-1" />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-1 size-2 rounded-full" />
          {label}
          <span className="text-muted-foreground">{format(value)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-5/40 size-2 rounded-full" />
          {secondaryLabel}
          <span className="text-muted-foreground">{format(secondary)}</span>
        </span>
      </div>
      {note && <span className="text-muted-foreground text-xs">{note}</span>}
    </div>
  );
}
