import { Reveal } from "@/components/marketing/reveal";

const DAYS = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"];

const LESSONS = [
  { day: 0, start: 1, len: 1, tone: "paid" },
  { day: 0, start: 3, len: 1.5, tone: "paid" },
  { day: 1, start: 0.5, len: 1, tone: "paid" },
  { day: 1, start: 2.5, len: 1, tone: "due" },
  { day: 2, start: 1.5, len: 1, tone: "paid" },
  { day: 3, start: 0, len: 1.5, tone: "paid" },
  { day: 3, start: 3, len: 1, tone: "due" },
  { day: 4, start: 1, len: 1, tone: "paid" },
  { day: 4, start: 2.5, len: 1, tone: "next" },
  { day: 5, start: 0.5, len: 2, tone: "next" },
] as const;

const COL = 52;
const ROW = 34;
const TOP = 26;
const LEFT = 6;

const TONE = {
  paid: "fill-success/25 stroke-success/60",
  due: "fill-warning/25 stroke-warning/60",
  next: "fill-primary/25 stroke-primary/70",
} as const;

export function HeroVisual() {
  return (
    <Reveal
      className="mk-rise relative"
      style={{ "--i": 3 } as React.CSSProperties}
      data-inview=""
    >
      <div
        aria-hidden
        className="bg-primary/25 absolute -inset-x-10 top-10 -z-10 h-2/3 rounded-full blur-3xl"
      />

      <div className="border-border-solid bg-card ring-foreground/5 shadow-primary/10 relative overflow-hidden rounded-2xl border shadow-2xl ring-1">
        <div className="border-border-solid flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="bg-foreground/15 size-2.5 rounded-full" />
            <span className="bg-foreground/15 size-2.5 rounded-full" />
            <span className="bg-foreground/15 size-2.5 rounded-full" />
          </div>
          <span className="font-mono-ui text-muted-foreground text-[11px] tracking-wide">
            tydzień 37 · 8–14 wrz
          </span>
          <span className="bg-success/15 text-success font-mono-ui rounded-md px-1.5 py-0.5 text-[10px]">
            <span className="mk-blink mr-1 inline-block size-1.5 rounded-full bg-current" />
            live
          </span>
        </div>

        <svg
          viewBox={`0 0 ${LEFT * 2 + COL * 7} ${TOP + ROW * 4.5 + 8}`}
          className="block w-full"
          role="img"
          aria-label="Widok tygodnia z zaplanowanymi zajęciami"
        >
          {DAYS.map((d, i) => (
            <text
              key={d}
              x={LEFT + i * COL + COL / 2}
              y={16}
              textAnchor="middle"
              className="fill-muted-foreground font-mono-ui text-[9px] uppercase"
            >
              {d}
            </text>
          ))}
          {[0, 1, 2, 3, 4].map((r) => (
            <line
              key={r}
              x1={LEFT}
              x2={LEFT + COL * 7}
              y1={TOP + r * ROW}
              y2={TOP + r * ROW}
              className="stroke-border-solid"
              strokeWidth={1}
              strokeDasharray={r === 0 ? undefined : "2 4"}
            />
          ))}
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <line
              key={c}
              x1={LEFT + c * COL}
              x2={LEFT + c * COL}
              y1={TOP}
              y2={TOP + ROW * 4.5}
              className="stroke-border-solid"
              strokeWidth={1}
            />
          ))}
          <rect
            x={LEFT + 4 * COL}
            y={TOP - 2}
            width={COL}
            height={ROW * 4.5 + 4}
            className="fill-primary/5"
          />
          {LESSONS.map((l, i) => (
            <g
              key={i}
              className="mk-grow-y"
              style={
                {
                  "--i": i,
                  transformOrigin: `${LEFT + l.day * COL + COL / 2}px ${TOP + l.start * ROW}px`,
                } as React.CSSProperties
              }
            >
              <rect
                x={LEFT + l.day * COL + 5}
                y={TOP + l.start * ROW + 2}
                width={COL - 10}
                height={l.len * ROW - 4}
                rx={4}
                strokeWidth={1}
                className={TONE[l.tone]}
              />
              <rect
                x={LEFT + l.day * COL + 5}
                y={TOP + l.start * ROW + 2}
                width={2.5}
                height={l.len * ROW - 4}
                rx={1.25}
                className={
                  l.tone === "paid"
                    ? "fill-success"
                    : l.tone === "due"
                      ? "fill-warning"
                      : "fill-primary"
                }
              />
            </g>
          ))}
          <g className="mk-sweep" style={{ "--mk-sweep": "18px" } as React.CSSProperties}>
            <line
              x1={LEFT + 4 * COL}
              x2={LEFT + 5 * COL}
              y1={TOP + ROW * 2.15}
              y2={TOP + ROW * 2.15}
              className="stroke-destructive"
              strokeWidth={1.25}
            />
            <circle
              cx={LEFT + 4 * COL}
              cy={TOP + ROW * 2.15}
              r={2.5}
              className="fill-destructive"
            />
          </g>
        </svg>

        <div className="border-border-solid grid grid-cols-3 divide-x border-t">
          <Stat label="Zarobione" value="3 850" tone="text-success" i={0} />
          <Stat label="Do zapłaty" value="480" tone="text-warning" i={1} />
          <Stat label="Zaplanowane" value="1 260" tone="text-foreground" i={2} />
        </div>
      </div>

      <div
        className="mk-pop border-border-solid bg-popover absolute -left-4 top-1/2 flex items-center gap-2.5 rounded-xl border px-3 py-2 shadow-xl sm:-left-8"
        style={{ "--i": 6 } as React.CSSProperties}
      >
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="10"
            className="fill-success/20 stroke-success"
            strokeWidth="1.5"
          />
          <path
            d="M7.5 12.5l3 3 6-6.5"
            fill="none"
            className="mk-draw stroke-success"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ "--len": 20, "--i": 7 } as React.CSSProperties}
          />
        </svg>
        <div className="leading-tight">
          <p className="text-xs font-semibold">Zofia · odbyte</p>
          <p className="text-muted-foreground font-mono-ui text-[11px]">
            + 90 zł · przelew
          </p>
        </div>
      </div>

      <div
        className="mk-pop border-border-solid bg-popover absolute -right-3 top-6 flex items-center gap-2 rounded-xl border px-3 py-2 shadow-xl sm:-right-6"
        style={{ "--i": 9 } as React.CSSProperties}
      >
        <svg viewBox="0 0 24 24" className="mk-ring text-warning size-5" aria-hidden>
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
        <p className="text-xs">
          Za 15 min: <span className="font-semibold">Janek, matma</span>
        </p>
      </div>
    </Reveal>
  );
}

function Stat({
  label,
  value,
  tone,
  i,
}: {
  label: string;
  value: string;
  tone: string;
  i: number;
}) {
  return (
    <div
      className="mk-drop flex flex-col gap-0.5 px-4 py-3"
      style={{ "--i": i } as React.CSSProperties}
    >
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className={`font-mono-ui text-lg font-semibold ${tone}`}>
        {value}
        <span className="text-muted-foreground ml-1 text-xs font-normal">zł</span>
      </span>
    </div>
  );
}
