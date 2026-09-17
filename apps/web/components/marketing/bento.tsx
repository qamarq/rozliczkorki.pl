import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "cn";

function v(i: number, extra?: CSSProperties) {
  return { "--i": i, ...extra } as CSSProperties;
}

export function Bento() {
  return (
    <div className="grid auto-rows-[minmax(0,auto)] gap-3 md:grid-cols-6">
      <Cell
        className="md:col-span-4 md:row-span-2"
        eyebrow="01"
        title="Kalendarz zajęć"
        description="Wpisujesz korki jak w kalendarzu i widzisz cały tydzień na raz. Dzisiejszy dzień zawsze na wierzchu."
      >
        <CalendarVisual />
      </Cell>

      <Cell
        className="md:col-span-2"
        eyebrow="02"
        title="Odbyło się / opłacone"
        description="Dwa kliknięcia po lekcji. Gotówka czy przelew: Ty wiesz, aplikacja pamięta."
      >
        <ToggleVisual />
      </Cell>

      <Cell
        className="md:col-span-2"
        eyebrow="03"
        title="Zarobki na żywo"
        description="Ile teoretycznie, ile już na koncie, ile jeszcze czeka."
      >
        <EarningsVisual />
      </Cell>

      <Cell
        className="md:col-span-2"
        eyebrow="04"
        title="Zajęcia cykliczne"
        description="„Wtorki 17:00” ustawiasz raz. Terminy same wchodzą na cały semestr."
      >
        <RecurringVisual />
      </Cell>

      <Cell
        className="md:col-span-2"
        eyebrow="05"
        title="Przypomnienia"
        description="Push przed zajęciami i sygnał, gdy ktoś zalega."
      >
        <ReminderVisual />
      </Cell>

      <Cell
        className="md:col-span-2"
        eyebrow="06"
        title="Zaległości pod ręką"
        description="Jedna lista niezapłaconych lekcji. Koniec liczenia z pamięci przed rozmową z rodzicem."
      >
        <DebtVisual />
      </Cell>

      <Cell
        className="md:col-span-3"
        eyebrow="07"
        title="Uczniowie i stawki"
        description="Adres, typ zajęć, historia stawek. Podnosisz cenę w marcu, a luty dalej liczy się po staremu."
      >
        <StudentsVisual />
      </Cell>

      <Cell
        className="md:col-span-3"
        eyebrow="08"
        title="Twoje dane są Twoje"
        description="Logowanie Google albo kluczem dostępu. Konto z całą historią kasujesz jednym kliknięciem."
      >
        <PrivacyVisual />
      </Cell>
    </div>
  );
}

function Cell({
  className,
  eyebrow,
  title,
  description,
  children,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "border-border-solid bg-card/70 hover:border-foreground/20 group relative flex flex-col overflow-hidden rounded-2xl border transition-colors",
        className,
      )}
    >
      <div className="flex flex-1 flex-col justify-end">{children}</div>
      <div className="flex flex-col gap-1.5 p-5 pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono-ui text-muted-foreground text-[11px]">
            {eyebrow}
          </span>
          <span className="bg-border-solid h-px w-4" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground text-pretty text-sm">{description}</p>
      </div>
    </Reveal>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-linegrid mask-fade-b relative px-5 pt-5", className)}>
      {children}
    </div>
  );
}

const WEEK = [[1, 2.5], [0.5, 3], [1.5], [0, 2, 3.5], [1, 2.5], [0.5], []];

function CalendarVisual() {
  const col = 48;
  const row = 22;
  return (
    <Frame className="min-h-64">
      <div className="border-border-solid bg-background/80 rounded-t-xl border border-b-0 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Wrzesień 2026</span>
          <div className="flex gap-1">
            <span className="bg-secondary block h-5 w-5 rounded-md" />
            <span className="bg-secondary block h-5 w-5 rounded-md" />
          </div>
        </div>
        <svg viewBox={`0 0 ${col * 7} ${row * 8 + 14}`} className="block w-full">
          {["pn", "wt", "śr", "cz", "pt", "sb", "nd"].map((d, i) => (
            <text
              key={d}
              x={i * col + col / 2}
              y={9}
              textAnchor="middle"
              className={cn(
                "font-mono-ui text-[7px] uppercase",
                i === 3 ? "fill-primary" : "fill-muted-foreground",
              )}
            >
              {d}
            </text>
          ))}
          <rect
            x={3 * col}
            y={12}
            width={col}
            height={row * 5}
            className="fill-primary/8"
            rx={4}
          />
          {WEEK.map((slots, day) =>
            slots.map((s, j) => (
              <rect
                key={`${day}-${j}`}
                x={day * col + 4}
                y={14 + s * row}
                width={col - 8}
                height={row - 4}
                rx={3}
                className={cn(
                  "mk-grow-y",
                  day < 3 || (day === 3 && j < 2)
                    ? "fill-success/30 stroke-success/50"
                    : "fill-primary/25 stroke-primary/60",
                )}
                strokeWidth={0.75}
                style={v(day * 2 + j, {
                  transformOrigin: `${day * col + col / 2}px ${14 + s * row}px`,
                })}
              />
            )),
          )}
          <g className="mk-sweep" style={{ "--mk-sweep": "8px" } as CSSProperties}>
            <line
              x1={3 * col}
              x2={4 * col}
              y1={14 + row * 1.6}
              y2={14 + row * 1.6}
              className="stroke-destructive"
              strokeWidth={1}
            />
          </g>
        </svg>
      </div>
    </Frame>
  );
}

function ToggleVisual() {
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 flex flex-col divide-y rounded-t-xl border border-b-0 shadow-sm">
        <Row label="Odbyło się" i={0} tone="text-success" />
        <Row label="Opłacone · gotówka" i={1} tone="text-success" />
      </div>
    </Frame>
  );
}

function Row({ label, i, tone }: { label: string; i: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
      <svg viewBox="0 0 20 20" className={cn("size-5", tone)} aria-hidden>
        <rect
          x="1.5"
          y="1.5"
          width="17"
          height="17"
          rx="5"
          fill="currentColor"
          className="mk-pop"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.5"
          style={v(i)}
        />
        <path
          d="M6 10.5l2.5 2.5L14 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mk-draw"
          style={v(i + 3, { "--len": 16 } as CSSProperties)}
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}

function EarningsVisual() {
  const path = "M0 52 C 20 50, 30 40, 45 38 S 70 30, 90 24 S 120 18, 140 10 L 160 6";
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 rounded-t-xl border border-b-0 p-3 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-[11px]">Ten miesiąc</span>
          <span className="font-mono-ui text-success text-sm font-semibold">+ 14%</span>
        </div>
        <svg viewBox="0 0 160 60" className="mt-1 block w-full" aria-hidden>
          <defs>
            <linearGradient id="mk-earn" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                className="[stop-color:var(--success)]"
                stopOpacity="0.35"
              />
              <stop offset="1" className="[stop-color:var(--success)]" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path} L160 60 L0 60 Z`}
            fill="url(#mk-earn)"
            className="mk-grow-x"
            style={v(0)}
          />
          <path
            d={path}
            fill="none"
            className="mk-draw stroke-success"
            strokeWidth="2"
            strokeLinecap="round"
            style={v(0, { "--len": 180 } as CSSProperties)}
          />
          <circle cx="160" cy="6" r="3" className="mk-pop fill-success" style={v(6)} />
        </svg>
      </div>
    </Frame>
  );
}

function RecurringVisual() {
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 rounded-t-xl border border-b-0 p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="text-primary size-4" aria-hidden>
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="mk-spin"
            />
          </svg>
          <span className="font-mono-ui text-xs">wt · 17:00 · 60 min</span>
        </div>
        <svg viewBox="0 0 140 24" className="block w-full" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <rect
              key={i}
              x={i * 10 + 1}
              y={i % 7 === 1 ? 2 : 8}
              width={8}
              height={i % 7 === 1 ? 20 : 8}
              rx={2}
              className={cn(i % 7 === 1 ? "mk-step fill-primary" : "fill-border-solid")}
              style={v(Math.floor(i / 7))}
            />
          ))}
        </svg>
      </div>
    </Frame>
  );
}

function ReminderVisual() {
  return (
    <Frame className="min-h-36">
      <div
        className="mk-drop border-border-solid bg-background/90 flex items-center gap-3 rounded-t-xl border border-b-0 p-3 shadow-sm"
        style={v(0)}
      >
        <svg
          viewBox="0 0 24 24"
          className="mk-ring text-warning size-6 shrink-0"
          aria-hidden
        >
          <path
            d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 20a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold">Za 15 min: Janek, matematyka</p>
          <p className="text-muted-foreground text-[11px]">ul. Długa 4 · 60 min</p>
        </div>
        <span className="text-muted-foreground font-mono-ui ml-auto text-[10px]">
          teraz
        </span>
      </div>
    </Frame>
  );
}

const DEBTS = [
  ["Zofia N.", "2 lekcje", "180"],
  ["Kuba W.", "1 lekcja", "80"],
  ["Ola K.", "3 lekcje", "220"],
] as const;

function DebtVisual() {
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 divide-y rounded-t-xl border border-b-0 shadow-sm">
        {DEBTS.map(([name, n, amount], i) => (
          <div
            key={name}
            className="mk-drop flex items-center gap-2 px-3 py-2 text-xs"
            style={v(i)}
          >
            <span className="bg-warning size-1.5 rounded-full" />
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground">{n}</span>
            <span className="font-mono-ui text-warning ml-auto">{amount} zł</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function StudentsVisual() {
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 flex items-center gap-3 rounded-t-xl border border-b-0 p-3 shadow-sm">
        <span className="bg-primary/15 text-primary font-mono-ui flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          ZN
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold">Zofia Nowak</p>
          <p className="text-muted-foreground text-[11px]">
            matematyka · 8 kl. · u ucznia
          </p>
        </div>
        <div className="font-mono-ui flex items-center gap-2 text-sm">
          <span className="text-muted-foreground relative">
            60 zł
            <span
              className="mk-grow-x bg-muted-foreground absolute inset-x-0 top-1/2 h-px"
              style={v(2)}
            />
          </span>
          <svg viewBox="0 0 16 16" className="text-muted-foreground size-3.5" aria-hidden>
            <path
              d="M3 8h9m-3-3l3 3-3 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mk-draw"
              style={v(3, { "--len": 20 } as CSSProperties)}
            />
          </svg>
          <span className="mk-pop text-success font-semibold" style={v(3)}>
            70 zł
          </span>
        </div>
      </div>
    </Frame>
  );
}

function PrivacyVisual() {
  return (
    <Frame className="min-h-36">
      <div className="border-border-solid bg-background/80 flex items-center gap-4 rounded-t-xl border border-b-0 p-3 shadow-sm">
        <svg viewBox="0 0 48 48" className="text-primary size-12 shrink-0" aria-hidden>
          <path
            d="M24 5l15 6v11c0 9.5-6.4 17.5-15 21-8.6-3.5-15-11.5-15-21V11l15-6Z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            className="mk-draw"
            style={v(0, { "--len": 130 } as CSSProperties)}
          />
          <path
            d="M17 24.5l5 5 9-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mk-draw"
            style={v(5, { "--len": 24 } as CSSProperties)}
          />
        </svg>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Google · klucz dostępu</span>
          <span className="border-destructive/40 text-destructive w-fit rounded-md border px-2 py-0.5 text-[11px]">
            Usuń konto i wszystkie dane
          </span>
        </div>
      </div>
    </Frame>
  );
}
