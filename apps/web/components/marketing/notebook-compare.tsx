"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "cn";
import {
  NOTEBOOK_LINES,
  NotebookLine,
  NotebookSum,
  NotebookTitle,
} from "@/components/marketing/notebook";

type Status = "paid" | "owed" | "cancelled";

const LESSONS: {
  date: string;
  first: string;
  last: string;
  detail: string;
  amount: string;
  status: Status;
}[] = [
  {
    date: "2 wrz",
    first: "Zofia",
    last: "Nowak",
    detail: "matematyka · 60 min",
    amount: "90 zł",
    status: "paid",
  },
  {
    date: "3 wrz",
    first: "Janek",
    last: "Wiśniewski",
    detail: "fizyka · 90 min",
    amount: "120 zł",
    status: "owed",
  },
  {
    date: "4 wrz",
    first: "Ola",
    last: "Kaczmarek",
    detail: "matematyka · 60 min",
    amount: "90 zł",
    status: "paid",
  },
  {
    date: "9 wrz",
    first: "Kuba",
    last: "Wójcik",
    detail: "angielski · 60 min",
    amount: "80 zł",
    status: "cancelled",
  },
  {
    date: "10 wrz",
    first: "Zofia",
    last: "Nowak",
    detail: "matematyka · 60 min",
    amount: "90 zł",
    status: "owed",
  },
];

const STATUS: Record<Status, { label: string; className: string }> = {
  paid: { label: "Opłacone", className: "bg-paid-soft text-success" },
  owed: { label: "Do zapłaty", className: "bg-owed-soft text-warning" },
  cancelled: { label: "Odwołane", className: "bg-secondary text-faint" },
};

const REST = 52;
const SHEET_ROWS =
  "grid-rows-[56px_repeat(5,54px)_84px] max-sm:grid-rows-[52px_repeat(5,52px)_80px]";

export function NotebookCompare({ className }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const touched = useRef(false);
  const dragging = useRef(false);

  function apply(value: number) {
    stageRef.current?.style.setProperty("--p", String(value / 100));
    if (rangeRef.current) rangeRef.current.value = String(Math.round(value));
  }

  function valueAt(clientX: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return REST;
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    touched.current = true;
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === "mouse") apply(valueAt(event.clientX));
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragging.current) apply(valueAt(event.clientX));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragging.current && event.pointerType !== "mouse") apply(valueAt(event.clientX));
    dragging.current = false;
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let start: number | undefined;
    const duration = 1800;

    function step(now: number) {
      if (touched.current) return;
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      apply(REST + 16 * Math.sin(t * Math.PI * 3) * (1 - t));
      if (t < 1) frame = requestAnimationFrame(step);
    }

    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <figure className={cn("m-0", className)}>
      <div
        ref={stageRef}
        className="group relative cursor-ew-resize touch-pan-y select-none"
        style={{ "--p": REST / 100 } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <div className="bg-card border-border relative isolate overflow-hidden rounded-[20px] border shadow-[0_1px_2px_rgb(21_25_53/0.06),0_24px_48px_-24px_rgb(21_25_53/0.35)]">
          <div
            className={cn(
              "relative z-10 grid px-[22px] pb-[18px] pt-4 max-sm:px-3.5",
              SHEET_ROWS,
            )}
          >
            <div className="border-border flex items-center justify-between border-b">
              <span className="font-semibold">Wrzesień 2026</span>
              <span className="text-muted-foreground text-[13px]">Płatności</span>
            </div>
            {LESSONS.map((lesson) => (
              <div
                key={lesson.date}
                className="border-border grid grid-cols-[44px_minmax(0,1fr)_auto_90px] items-center gap-2.5 border-b text-[14.5px] max-sm:grid-cols-[38px_minmax(0,1fr)_auto_76px] max-sm:gap-2 max-sm:text-sm"
              >
                <span className="text-faint text-[13px] tabular-nums">{lesson.date}</span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-semibold">
                    {lesson.first} <span className="max-sm:hidden">{lesson.last}</span>
                  </p>
                  <p className="text-muted-foreground truncate text-[12.5px]">
                    {lesson.detail}
                  </p>
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-right font-semibold tabular-nums",
                    lesson.status === "cancelled" &&
                      "text-faint font-medium line-through",
                  )}
                >
                  {lesson.amount}
                </span>
                <span
                  className={cn(
                    "justify-self-end whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold max-sm:px-2 max-sm:text-[11px]",
                    STATUS[lesson.status].className,
                  )}
                >
                  {STATUS[lesson.status].label}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-7 max-sm:gap-4">
              <span className="text-muted-foreground text-[12.5px] leading-snug max-sm:invisible">
                Cały wrzesień,
                <br />
                stan na 27.09
              </span>
              <Total label="Zarobione" value="3 850" className="text-success" />
              <Total label="Do zapłaty" value="480" className="text-warning" />
            </div>
          </div>

          <div
            aria-hidden
            className={cn(
              "bg-notebook text-pen font-hand absolute inset-0 z-20 grid pb-[18px] pl-3 pr-[22px] pt-4 max-sm:pl-1.5 max-sm:pr-3.5",
              SHEET_ROWS,
            )}
            style={{
              clipPath: "inset(0 calc((1 - var(--p)) * 100%) 0 0)",
            }}
          >
            <span className="bg-margin absolute inset-y-0 left-[70px] w-0.5 opacity-70 max-sm:left-[50px]" />
            <NotebookTitle className="pb-2 pl-[70px] max-sm:pl-[52px]" />
            {NOTEBOOK_LINES.map((line, i) => (
              <NotebookLine key={line.date} line={line} index={i} />
            ))}
            <NotebookSum className="pl-[70px] max-sm:pl-[52px]" />
          </div>

          <span
            aria-hidden
            className="bg-primary pointer-events-none absolute inset-y-0 z-30 w-0.5 -translate-x-1/2"
            style={{ left: "calc(var(--p) * 100%)" }}
          />
        </div>

        <span
          aria-hidden
          className="border-primary bg-card text-primary group-has-[input:focus-visible]:ring-primary/35 pointer-events-none absolute top-1/2 z-40 grid size-[42px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 shadow-md transition-[scale] duration-200 group-hover:scale-110 group-has-[input:focus-visible]:ring-4 motion-reduce:transition-none"
          style={{ left: "calc(var(--p) * 100%)" }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5">
            <path
              d="M7.5 6 3.5 10l4 4M12.5 6l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <input
          ref={rangeRef}
          type="range"
          min={0}
          max={100}
          defaultValue={REST}
          aria-label="Porównaj zeszyt z aplikacją"
          onChange={(event) => {
            touched.current = true;
            apply(Number(event.currentTarget.value));
          }}
          className="sr-only"
        />
      </div>
      <figcaption className="text-muted-foreground mt-3.5 flex items-center justify-between gap-3 text-[13.5px]">
        <span className="font-hand text-foreground text-[21px] leading-none">Zeszyt</span>
        <span>przeciągnij, żeby porównać</span>
        <span className="text-foreground font-semibold">RozliczKorki</span>
      </figcaption>
    </figure>
  );
}

function Total({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div>
      <span className="text-muted-foreground block text-[12.5px]">{label}</span>
      <span
        className={cn(
          "whitespace-nowrap text-xl font-bold tabular-nums max-sm:text-[17px]",
          className,
        )}
      >
        {value}
        <span className="ml-0.5 text-[13px] font-semibold">zł</span>
      </span>
    </div>
  );
}
