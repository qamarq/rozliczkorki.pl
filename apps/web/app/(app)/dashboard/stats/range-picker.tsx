"use client";

import { endOfDay, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatRange, PRESETS, presetRange, type PresetId, type Range } from "./range";

export function RangePicker({
  range,
  preset,
  now,
  onChange,
}: {
  range: Range;
  preset: PresetId | null;
  now: Date;
  onChange: (range: Range, preset: PresetId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>({
    from: range.from,
    to: range.to,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <CalendarDays className="size-4" />
          {formatRange(range)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto flex-row gap-3 p-3">
        <div className="flex w-44 shrink-0 flex-col gap-1">
          {PRESETS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={preset === item.id ? "default" : "secondary"}
              className={cn(
                "h-8 justify-start rounded-full px-3 text-xs font-medium",
                preset !== item.id && "hover:bg-secondary bg-transparent",
              )}
              onClick={() => {
                const next = presetRange(item.id, now);
                setDraft({ from: next.from, to: next.to });
                onChange(next, item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <Calendar
          mode="range"
          locale={pl}
          numberOfMonths={2}
          defaultMonth={range.from}
          selected={draft}
          onSelect={(value) => {
            setDraft(value);
            if (value?.from && value.to) {
              onChange({ from: startOfDay(value.from), to: endOfDay(value.to) }, null);
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
