"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type TrendPoint = {
  label: string;
  actual: number | null;
  forecast: number | null;
  previous: number | null;
};

const config = {
  actual: { label: "Ten okres", color: "var(--chart-1)" },
  forecast: { label: "Prognoza", color: "var(--chart-1)" },
  previous: { label: "Poprzedni okres", color: "var(--success)" },
} satisfies ChartConfig;

export function TrendChart({
  data,
  formatValue,
  formatAxis,
}: {
  data: TrendPoint[];
  formatValue: (value: number) => string;
  formatAxis: (value: number) => string;
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-actual)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-actual)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
        />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={formatAxis} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatValue(Number(value))}
                  </span>
                </span>
              )}
              indicator="line"
            />
          }
        />
        <Area
          dataKey="actual"
          type="monotone"
          stroke="var(--color-actual)"
          strokeWidth={2}
          fill="url(#trend-fill)"
          connectNulls={false}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          dataKey="forecast"
          type="monotone"
          stroke="var(--color-forecast)"
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="url(#trend-fill)"
          fillOpacity={0.4}
          connectNulls={false}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          dataKey="previous"
          type="monotone"
          stroke="var(--color-previous)"
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="none"
          connectNulls
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
