import { Logo } from "@/components/logo";
import Link from "next/link";

export function AuthPanel() {
  return (
    <div className="bg-sidebar relative hidden overflow-hidden md:block">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary absolute -left-16 -top-24 size-80 rounded-full opacity-40 blur-[90px]" />
        <div className="bg-success absolute -bottom-28 -right-20 size-80 rounded-full opacity-30 blur-[90px]" />
      </div>

      <div className="relative flex h-full flex-col justify-between gap-10 p-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="text-brand-gradient text-lg font-bold">RozliczKorki</span>
          </Link>
          <p className="max-w-[18rem] text-balance text-xl font-semibold leading-snug">
            Kalendarz korepetycji, płatności i zarobki w jednej aplikacji.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="border-success bg-card/70 rounded-xl border-l-2 p-4 backdrop-blur-sm">
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Zarobiono w tym miesiącu
            </p>
            <p className="text-success text-2xl font-bold tabular-nums">3 850 zł</p>
            <p className="text-muted-foreground text-xs">
              37h lekcyjnych · 100% opłacone
            </p>
          </div>

          <div className="bg-card/70 flex items-center justify-between gap-3 rounded-xl p-3 backdrop-blur-sm">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Zofia Kowalska</p>
              <p className="text-muted-foreground text-xs">16:00 · Matematyka</p>
            </div>
            <span className="bg-success/15 text-success border-success/30 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium">
              Odbyta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
