import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Reveal } from "@/components/marketing/reveal";

const CARD =
  "bg-card border-border rounded-2xl border p-4 text-[14.5px] shadow-[0_1px_2px_rgb(21_25_53/0.05),0_10px_24px_-14px_rgb(21_25_53/0.25)]";

const ITEMS: { title: string; body: string; specimen: ReactNode }[] = [
  {
    title: "Szkółki",
    body: "Zajęcia prowadzone przez szkołę językową albo platformę liczą się osobno od prywatnych. Przelew od szkółki odhaczasz, kiedy przyjdzie.",
    specimen: (
      <div className={CARD}>
        <Row>
          <Named name="Szkółka Poliglota" sub="8 zajęć we wrześniu" />
          <div className="text-right">
            <span className="text-muted-foreground block text-[13px]">Do wypłaty</span>
            <span className="text-warning font-bold tabular-nums">640 zł</span>
          </div>
        </Row>
        <Row divided>
          <span className="text-muted-foreground text-[13px]">
            Czeka na przelew od 1 października
          </span>
          <span className="bg-paid-soft text-success inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold">
            <Check className="size-3.5" strokeWidth={2.6} />
            Przelew przyszedł
          </span>
        </Row>
      </div>
    ),
  },
  {
    title: "Urlopy",
    body: "Wpisujesz ferie albo wyjazd, a aplikacja pokazuje, które zajęcia trzeba odwołać i których uczniów uprzedzić.",
    specimen: (
      <div className={CARD}>
        <Named name="Ferie zimowe" sub="16–29 lutego 2027" />
        <Row divided>
          <span>Trzeba odwołać</span>
          <span className="font-bold tabular-nums">6 zajęć</span>
        </Row>
        <Row divided>
          <span>Do powiadomienia</span>
          <span className="font-bold tabular-nums">4 uczniów</span>
        </Row>
      </div>
    ),
  },
  {
    title: "Stawki z historią",
    body: "Podnosisz stawkę od września, a sierpień dalej liczy się po staremu. Niczego nie przeliczasz ręcznie.",
    specimen: (
      <div className={CARD}>
        <Row>
          <Named name="Zofia Nowak" sub="matematyka · 60 min" />
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <s className="text-faint">80 zł</s>
            <span aria-hidden>→</span>
            <span className="text-success text-lg font-bold tabular-nums">90 zł</span>
          </span>
        </Row>
        <Row divided>
          <span className="text-muted-foreground text-[13px]">
            Nowa stawka od 1 września 2026
          </span>
        </Row>
      </div>
    ),
  },
  {
    title: "Statystyki",
    body: "Stawka efektywna, ściągalność i prognoza na koniec okresu. Widać też, ile zajęć odwołano w tym roku.",
    specimen: (
      <div className={cn(CARD, "grid grid-cols-3 gap-2.5")}>
        <Stat label="Stawka efektywna" value="84 zł/h" />
        <Stat label="Ściągalność" value="89%" />
        <Stat label="Prognoza" value="4 870 zł" />
      </div>
    ),
  },
];

export function Ledger() {
  return (
    <div className="border-border-solid mt-14 border-b">
      {ITEMS.map((item) => (
        <Reveal
          key={item.title}
          className="border-border-solid grid items-center gap-3 border-t py-7 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-9 lg:py-8"
        >
          <h3 className="font-display mk-reveal text-[26px] font-semibold tracking-[-0.005em]">
            {item.title}
          </h3>
          <p className="text-muted-foreground mk-reveal text-pretty" style={d(1)}>
            {item.body}
          </p>
          <div className="mk-reveal mt-2 max-w-md lg:mt-0 lg:max-w-none" style={d(2)}>
            {item.specimen}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function d(i: number) {
  return { "--i": i } as CSSProperties;
}

function Row({ children, divided }: { children: ReactNode; divided?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        divided && "border-border mt-2.5 border-t pt-2.5",
      )}
    >
      {children}
    </div>
  );
}

function Named({ name, sub }: { name: string; sub: string }) {
  return (
    <div>
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground text-[13px]">{sub}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground block text-xs">{label}</span>
      <span className="whitespace-nowrap text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}
