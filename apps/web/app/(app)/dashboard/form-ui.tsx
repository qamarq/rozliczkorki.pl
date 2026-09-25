"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const FIELD = "h-10 rounded-[10px] md:text-sm";
export const SELECT = "w-full rounded-[10px] data-[size=default]:h-10";
export const ACTION = "h-10 rounded-[10px] px-4";

export function FormDialogContent({
  title,
  description,
  onSubmit,
  footer,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogContent
      showCloseButton={false}
      className={cn(
        "bg-background flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <DialogTitle className="font-display text-[1.6rem] font-semibold leading-tight">
            {title}
          </DialogTitle>
          <DialogDescription
            className={cn(
              "text-muted-foreground text-pretty text-sm",
              !description && "sr-only",
            )}
          >
            {description ?? title}
          </DialogDescription>
        </div>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 shrink-0"
            aria-label="Zamknij"
          >
            <X />
          </Button>
        </DialogClose>
      </div>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        <div className="border-border bg-card/50 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5 sm:px-6">
          {footer}
        </div>
      </form>
    </DialogContent>
  );
}

export function FormCard({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card ring-foreground/10 flex flex-col gap-4 rounded-2xl p-4 ring-1 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("bg-secondary flex gap-0.5 rounded-[10px] p-[3px]", className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-visible:ring-ring/50 h-[34px] flex-auto whitespace-nowrap rounded-[8px] px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
              checked
                ? "bg-card text-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
