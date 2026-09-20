import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const AGENDA = [
  { time: "15:00", name: "Zofia", subject: "matma · 60 min", tone: "paid" },
  { time: "16:30", name: "Janek", subject: "fizyka · 90 min", tone: "next" },
  { time: "18:30", name: "Ola", subject: "matma · 60 min", tone: "due" },
] as const;

const TONE = {
  paid: "bg-success",
  due: "bg-warning",
  next: "bg-primary",
} as const;

export function PhoneVisual({ className }: { className?: string }) {
  return (
    <Reveal className={`relative ${className ?? ""}`}>
      <div
        aria-hidden
        className="bg-primary/25 absolute inset-x-0 top-12 -z-10 h-2/3 rounded-full blur-3xl"
      />

      <div className="border-border-solid bg-card ring-foreground/5 relative mx-auto w-[15rem] rounded-[2.25rem] border p-2 shadow-2xl ring-1">
        <div className="bg-background overflow-hidden rounded-[1.75rem]">
          <div className="relative flex items-center justify-center pb-1 pt-3">
            <span className="bg-foreground/15 h-1.5 w-16 rounded-full" />
          </div>

          <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold tracking-tight">Dziś</span>
              <span className="font-mono-ui text-muted-foreground text-[10px]">
                pt · 12 wrz
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {AGENDA.map((lesson, i) => (
                <li
                  key={lesson.time}
                  className="mk-drop border-border-solid bg-card flex items-center gap-2.5 rounded-xl border p-2.5"
                  style={{ "--i": i } as CSSProperties}
                >
                  <span
                    className={`h-8 w-1 rounded-full ${TONE[lesson.tone]}`}
                    aria-hidden
                  />
                  <div className="flex flex-1 flex-col leading-tight">
                    <span className="text-xs font-semibold">{lesson.name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {lesson.subject}
                    </span>
                  </div>
                  <span className="font-mono-ui text-muted-foreground text-[10px]">
                    {lesson.time}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-border-solid flex items-center justify-between rounded-xl border px-3 py-2">
              <span className="text-muted-foreground text-[10px]">Dziś zarobione</span>
              <span className="font-mono-ui text-success text-sm font-semibold">
                240
                <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                  zł
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mk-pop border-border-solid bg-popover absolute -left-2 top-10 flex items-center gap-2.5 rounded-xl border px-3 py-2 shadow-xl sm:-left-6"
        style={{ "--i": 5 } as CSSProperties}
      >
        <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-lg">
          <Check className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-xs font-semibold">Za 15 min: Janek</p>
          <p className="text-muted-foreground font-mono-ui text-[10px]">
            powiadomienie push
          </p>
        </div>
      </div>
    </Reveal>
  );
}
