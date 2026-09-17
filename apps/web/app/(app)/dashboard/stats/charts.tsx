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
};

const config = {
  actual: { label: "Zrealizowane", color: "var(--chart-1)" },
  forecast: { label: "Prognoza", color: "var(--chart-1)" },
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
              formatter={(value) => formatValue(Number(value))}
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
      </AreaChart>
    </ChartContainer>
  );
}
