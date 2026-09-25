import type { CSSProperties } from "react";
import {
  NOTEBOOK_LINES,
  NotebookLine,
  NotebookSum,
  NotebookTitle,
} from "@/components/marketing/notebook";

const SHADOW =
  "shadow-[0_1px_2px_rgb(21_25_53/0.06),0_28px_56px_-28px_rgb(21_25_53/0.45)]";

export function AuthPanel() {
  return (
    <aside className="bg-secondary relative hidden min-h-svh flex-col justify-center gap-16 overflow-hidden px-14 py-12 lg:flex xl:px-20">
      <div className="relative mx-auto w-full max-w-[470px] pb-32 pr-10">
        <div
          aria-hidden
          className={`bg-notebook text-pen font-hand mk-rise relative -rotate-2 rounded-2xl px-5 pb-12 pt-6 ${SHADOW}`}
        >
          <span className="bg-margin absolute inset-y-0 left-[76px] w-0.5 opacity-70" />
          <NotebookTitle className="pl-[64px]" />
          <div className="mt-6 flex flex-col gap-5">
            {NOTEBOOK_LINES.map((line, i) => (
              <NotebookLine key={line.date} line={line} index={i} />
            ))}
          </div>
          <NotebookSum className="mt-7 pl-[64px]" />
        </div>

        <div
          className={`bg-card border-border mk-rise absolute -right-4 bottom-0 w-[280px] rotate-[1.5deg] rounded-2xl border p-4 ${SHADOW}`}
          style={{ "--i": 8 } as CSSProperties}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">Wrzesień 2026</span>
            <span className="text-muted-foreground text-xs">RozliczKorki</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground block text-xs">Zarobione</span>
              <span className="text-success text-xl font-bold tabular-nums">
                3 850 zł
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Do zapłaty</span>
              <span className="text-warning text-xl font-bold tabular-nums">480 zł</span>
            </div>
          </div>
          <p className="text-muted-foreground border-border mt-3 border-t pt-3 text-[13px]">
            Zalegają: Zofia N., Janek W., Ola K.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[470px]">
        <p className="font-display text-balance text-3xl font-semibold leading-tight tracking-[-0.01em]">
          Zeszyt z korkami możesz już zamknąć.
        </p>
        <p className="text-muted-foreground mt-3 text-pretty">
          Kalendarz, płatności i zarobki korepetytora w jednym miejscu. Za darmo, na
          iPhonie, Androidzie i w przeglądarce.
        </p>
      </div>
    </aside>
  );
}
