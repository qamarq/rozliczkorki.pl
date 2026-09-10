"use client";

import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { pl } from "date-fns/locale";
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
import { formatPLN } from "@/lib/utils";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Statystyki</h1>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-brand-gradient border-none text-white">
          <CardHeader>
            <CardTitle className="text-sm text-white/80">Teoretyczne zarobki</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatPLN(data?.theoretical ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">Opłacone</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {formatPLN(data?.paid ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">Do zapłaty</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {formatPLN(data?.unpaid ?? 0)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm">
            Zajęcia w miesiącu
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <span>Odbyte: {data?.completedCount ?? 0}</span>
          <span>Zaplanowane: {data?.scheduledCount ?? 0}</span>
          <span>Odwołane: {data?.cancelledCount ?? 0}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm">Wg ucznia</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uczeń</TableHead>
                <TableHead className="text-right">Teoretycznie</TableHead>
                <TableHead className="text-right">Opłacone</TableHead>
                <TableHead className="text-right">Do zapłaty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.byStudent.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right">
                    {formatPLN(row.theoretical)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {formatPLN(row.paid)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
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
