import type { CSSProperties } from "react";
import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  {
    n: "01",
    title: "Dodaj uczniów",
    description:
      "Imię, stawka godzinowa, ewentualnie adres i telefon. Stawkę zmienisz kiedy chcesz, stare zajęcia zachowają starą cenę.",
    eta: "~5 min",
  },
  {
    n: "02",
    title: "Wrzuć zajęcia do kalendarza",
    description:
      "Pojedyncze terminy albo reguła cykliczna na cały semestr. Długość lekcji dowolna, rozliczenie liczy się proporcjonalnie.",
    eta: "~10 min",
  },
  {
    n: "03",
    title: "Odklikuj po lekcji",
    description:
      "Odbyło się, zapłacone gotówką albo przelewem. Statystyki i zaległości aktualizują się same.",
    eta: "2 kliknięcia",
  },
];

export function Steps() {
  return (
    <Reveal className="relative">
      <svg
        aria-hidden
        className="text-border-solid absolute left-0 top-6 hidden h-px w-full md:block"
        viewBox="0 0 100 1"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          x2="100"
          y1="0.5"
          y2="0.5"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 6"
          className="mk-dash"
        />
      </svg>
      <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
        {STEPS.map((step, i) => (
          <li
            key={step.n}
            className="mk-drop relative flex flex-col gap-3"
            style={{ "--i": i * 2 } as CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="border-border-solid bg-background font-mono-ui text-primary relative z-10 flex size-12 items-center justify-center rounded-full border text-sm font-semibold">
                {step.n}
              </span>
              <span className="border-border-solid text-muted-foreground font-mono-ui rounded-full border px-2 py-0.5 text-[11px]">
                {step.eta}
              </span>
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
