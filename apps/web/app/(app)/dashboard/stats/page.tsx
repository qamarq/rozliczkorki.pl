"use client";

import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarCheck2, CircleSlash2, PiggyBank, Wallet } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPLN } from "@/lib/utils";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), i);
  return {
    value: format(date, "yyyy-MM"),
    label: format(date, "LLLL yyyy", { locale: pl }),
  };
});

export default function StatsPage() {
  const [month, setMonth] = useState(MONTH_OPTIONS[0]!.value);
  const monthDate = new Date(`${month}-01`);
  const from = startOfMonth(monthDate);
  const to = endOfMonth(monthDate);

  const { data } = trpc.stats.summary.useQuery({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const collectionRate =
    data && data.theoretical > 0
      ? Math.min(100, Math.round((data.paid / data.theoretical) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Finanse i rozliczenia</h1>
          <p className="text-muted-foreground text-sm">
            Przychody, zaległości i podsumowanie miesiąca.
          </p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="capitalize">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceCard
          icon={PiggyBank}
          label="Potencjalny przychód"
          value={formatPLN(data?.theoretical ?? 0)}
          tone="primary"
        />
        <FinanceCard
          icon={Wallet}
          label="Zrealizowany przychód"
          value={formatPLN(data?.paid ?? 0)}
          tone="success"
          sub={`Skuteczność ściągalności ${collectionRate}%`}
        />
        <FinanceCard
          icon={CalendarCheck2}
          label="Do zapłaty"
          value={formatPLN(data?.unpaid ?? 0)}
          tone="warning"
        />
        <FinanceCard
          icon={CircleSlash2}
          label="Odwołane zajęcia"
          value={String(data?.cancelledCount ?? 0)}
          tone="destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Zajęcia w miesiącu
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <span>
            Odbyte <b className="tabular-nums">{data?.completedCount ?? 0}</b>
          </span>
          <span>
            Zaplanowane <b className="tabular-nums">{data?.scheduledCount ?? 0}</b>
          </span>
          <span>
            Odwołane <b className="tabular-nums">{data?.cancelledCount ?? 0}</b>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Rozliczenia wg ucznia
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Uczeń</TableHead>
                <TableHead className="text-right">Teoretycznie</TableHead>
                <TableHead className="text-right">Opłacone</TableHead>
                <TableHead className="pr-4 text-right">Do zapłaty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.byStudent.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell className="pl-4 font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPLN(row.theoretical)}
                  </TableCell>
                  <TableCell className="text-success text-right tabular-nums">
                    {formatPLN(row.paid)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right tabular-nums",
                      row.unpaid > 0 && "text-warning",
                    )}
                  >
                    {formatPLN(row.unpaid)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceCard({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "destructive";
  sub?: string;
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
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </Card>
  );
}
