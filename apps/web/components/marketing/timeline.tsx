import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/marketing/reveal";

const MOMENTS: {
  time: string;
  label: string;
  title: string;
  body: string;
  ui: ReactNode;
}[] = [
  {
    time: "16:15",
    label: "przed lekcją",
    title: "Przypomni, do kogo i dokąd",
    body: "Powiadomienie 15 minut przed zajęciami, razem z adresem ucznia. Widżet pokazuje plan dnia, a lekcje cykliczne same wchodzą na cały semestr.",
    ui: (
      <>
        <Notification />
        <TodayWidget />
      </>
    ),
  },
  {
    time: "18:00",
    label: "po lekcji",
    title: "Dwa kliknięcia i po sprawie",
    body: "Gdy zajęcia się kończą, ekran blokady przypomina o płatności. Zaznaczasz „odbyło się” i „zapłacone”, gotówką albo przelewem. Odwołaną lekcję też oznaczysz.",
    ui: (
      <>
        <LiveActivity />
        <LessonCard />
      </>
    ),
  },
  {
    time: "27 wrz",
    label: "koniec miesiąca",
    title: "Rozliczenie liczy się samo",
    body: "Widzisz, ile już wpadło, ile czeka i ile jest jeszcze zaplanowane. Lista zaległości jest gotowa przed rozmową z rodzicem.",
    ui: <MonthSummary />,
  },
];

function d(i: number) {
  return { "--i": i } as CSSProperties;
}

export function Timeline() {
  return (
    <Reveal className="relative mt-14">
      <span
        aria-hidden
        className="mk-grow-x border-border-solid absolute inset-x-0 top-[9px] hidden border-t-[1.5px] border-dashed lg:block"
      />
      <span
        aria-hidden
        className="mk-grow-y border-border-solid absolute bottom-0 left-[9px] top-3 border-l-[1.5px] border-dashed lg:hidden"
        style={{ transformOrigin: "top" }}
      />
      <ol className="relative grid gap-14 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto] lg:gap-x-8 lg:gap-y-0">
        {MOMENTS.map((moment, i) => (
          <li
            key={moment.time}
            className="grid gap-4 lg:row-span-3 lg:grid-rows-subgrid lg:gap-y-5"
          >
            <div className="bg-background text-muted-foreground relative flex w-fit items-center gap-2.5 pr-3 text-sm">
              <span
                className="mk-pop border-primary bg-background grid size-[19px] place-items-center rounded-full border-[1.5px]"
                style={d(i)}
              >
                <span className="bg-primary size-2 rounded-full" />
              </span>
              <time className="text-foreground font-semibold tabular-nums">
                {moment.time}
              </time>
              {moment.label}
            </div>
            <div className="mk-reveal flex flex-col gap-2 pl-8 lg:pl-0" style={d(i * 2)}>
              <h3 className="text-[19px] font-semibold tracking-tight">{moment.title}</h3>
              <p className="text-muted-foreground text-pretty">{moment.body}</p>
            </div>
            <div
              className="mk-reveal flex max-w-md flex-col gap-3 self-start pl-8 lg:max-w-none lg:pl-0"
              style={d(i * 2 + 1)}
            >
              {moment.ui}
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

const CARD =
  "bg-card border-border rounded-2xl border shadow-[0_1px_2px_rgb(21_25_53/0.05),0_10px_24px_-14px_rgb(21_25_53/0.25)]";

function Notification() {
  return (
    <div
      className={cn(
        CARD,
        "grid grid-cols-[38px_minmax(0,1fr)] gap-3 rounded-[20px] p-3.5",
      )}
    >
      <Logo className="size-[38px]" />
      <div className="min-w-0 text-[14.5px]">
        <div className="text-muted-foreground flex justify-between gap-2 text-[11.5px] uppercase tracking-[0.05em]">
          <span>RozliczKorki</span>
          <span>teraz</span>
        </div>
        <p className="mt-0.5 font-semibold">Za 15 min: Janek, fizyka</p>
        <p className="text-muted-foreground">ul. Długa 4 · 90 min</p>
      </div>
    </div>
  );
}

function TodayWidget() {
  const lessons = [
    { time: "15:00", name: "Zofia", subject: "matma" },
    { time: "16:30", name: "Janek", subject: "fizyka", now: true },
    { time: "18:30", name: "Ola", subject: "matma" },
  ];
  return (
    <div className={cn(CARD, "w-full max-w-[250px] rounded-[22px] p-3.5 text-[14.5px]")}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-muted-foreground text-xs uppercase tracking-[0.05em]">
          Dziś
        </span>
        <span className="text-sm font-semibold">3 lekcje</span>
      </div>
      <ul className="grid gap-1">
        {lessons.map((lesson) => (
          <li
            key={lesson.time}
            className={cn(
              "grid grid-cols-[44px_minmax(0,1fr)] gap-1.5 rounded-lg px-2 py-1.5",
              lesson.now && "bg-accent",
            )}
          >
            <time
              className={cn(
                "text-muted-foreground text-[13.5px] tabular-nums",
                lesson.now && "text-accent-foreground font-semibold",
              )}
            >
              {lesson.time}
            </time>
            <span>
              {lesson.name}{" "}
              <span className="text-muted-foreground text-[13px]">
                · {lesson.subject}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LiveActivity() {
  return (
    <div className="rounded-[22px] bg-[#0f1226] px-[18px] py-3.5 text-[#f2f3fa]">
      <p className="text-[13px] text-[#a1a1aa]">Zajęcia zakończone · oznacz płatność</p>
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="text-[17px] font-semibold">Janek</span>
        <span className="text-[13px] tabular-nums text-[#a1a1aa]">16:30–18:00</span>
      </div>
      <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-white/15">
        <span className="mk-grow-x block h-full rounded-full bg-[#34d399]" style={d(3)} />
      </div>
    </div>
  );
}

function LessonCard() {
  return (
    <div className={cn(CARD, "overflow-hidden text-[14.5px]")}>
      <div className="flex items-center justify-between gap-2 p-4">
        <div>
          <p className="text-[15.5px] font-semibold">Janek Wiśniewski</p>
          <p className="text-muted-foreground text-[13.5px]">fizyka · 90 min</p>
        </div>
        <span className="text-[17px] font-bold tabular-nums">120 zł</span>
      </div>
      <CheckRow label="Odbyło się" />
      <CheckRow label="Opłacone" hint="dziś, 18:02" />
      <div className="bg-secondary mx-4 mb-3.5 grid grid-cols-2 gap-0.5 rounded-[10px] p-[3px] text-center text-[13.5px]">
        <span className="text-muted-foreground rounded-lg p-1.5">Gotówka</span>
        <span className="bg-card rounded-lg p-1.5 font-semibold shadow-sm">Przelew</span>
      </div>
    </div>
  );
}

function CheckRow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="border-border flex items-center gap-2.5 border-t px-4 py-2.5 font-medium">
      <span className="bg-success grid size-[22px] place-items-center rounded-[7px] text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {label}
      {hint && (
        <span className="text-muted-foreground ml-auto text-[13px] font-normal">
          {hint}
        </span>
      )}
    </div>
  );
}

function MonthSummary() {
  const debts = [
    { name: "Zofia N.", lessons: "2 lekcje", amount: "180 zł" },
    { name: "Janek W.", lessons: "1 lekcja", amount: "120 zł" },
    { name: "Ola K.", lessons: "2 lekcje", amount: "180 zł" },
  ];
  return (
    <div className={cn(CARD, "overflow-hidden text-[14.5px]")}>
      <div className="flex items-baseline justify-between gap-2 px-4 pt-3.5">
        <span className="font-semibold">Wrzesień 2026</span>
        <span className="text-muted-foreground text-[13px]">stan na 27 września</span>
      </div>
      <div className="border-border grid grid-cols-3 gap-2 border-b px-4 pb-4 pt-3">
        <Figure label="Zarobione" value="3 850 zł" className="text-success" />
        <Figure label="Do zapłaty" value="480 zł" className="text-warning" />
        <Figure label="Zaplanowane" value="540 zł" />
      </div>
      <p className="text-muted-foreground px-4 pb-1 pt-3 text-xs uppercase tracking-[0.06em]">
        Zaległości
      </p>
      <ul className="divide-border divide-y px-4 pb-2.5">
        {debts.map((debt) => (
          <li
            key={debt.name}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 py-[7px]"
          >
            <span className="font-semibold">{debt.name}</span>
            <span className="text-muted-foreground text-[13.5px]">{debt.lessons}</span>
            <span className="text-warning min-w-[60px] text-right font-semibold tabular-nums">
              {debt.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Figure({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <span className="text-muted-foreground block text-xs">{label}</span>
      <span className={cn("whitespace-nowrap text-lg font-bold tabular-nums", className)}>
        {value}
      </span>
    </div>
  );
}
