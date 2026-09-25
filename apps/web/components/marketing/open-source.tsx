import type { CSSProperties } from "react";
import { CreditCard, Github, KeyRound, Trash2 } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { GITHUB_URL } from "@/lib/site";

const FACTS = [
  {
    icon: KeyRound,
    title: "Logowanie bez nowego hasła",
    body: "Google albo klucz dostępu, a na iPhonie także Apple. Zwykłe konto na e-mail też działa.",
  },
  {
    icon: Trash2,
    title: "Konto usuwasz sam(a)",
    body: "W ustawieniach, razem z całą historią zajęć. Po kliknięciu linku z maila dane znikają od razu.",
  },
  {
    icon: CreditCard,
    title: "Bez opłat i bez karty",
    body: "Wszystkie funkcje są dostępne za 0 zł. Przy rejestracji nie podajesz karty.",
  },
];

export function OpenSource() {
  return (
    <section id="otwarty-kod" className="bg-secondary scroll-mt-6 py-20 sm:py-24">
      <Reveal className="site-container grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="mk-reveal flex flex-col items-start gap-6">
          <SectionHeading
            title="Otwarty kod. Twoje dane."
            description="Cały kod aplikacji webowej i mobilnych jest publiczny, na licencji AGPL-3.0. Każdy może sprawdzić, co dzieje się z danymi Twoich uczniów."
          />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="border-border-solid bg-card hover:border-foreground inline-flex h-12 items-center gap-2.5 rounded-xl border px-5 font-semibold transition-colors"
          >
            <Github className="size-[18px]" />
            Zobacz kod na GitHubie
          </a>
          <span className="text-muted-foreground -mt-3 text-sm">
            github.com/qamarq/rozliczkorki.pl
          </span>
        </div>
        <ul className="border-border-solid divide-border-solid divide-y border-y">
          {FACTS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="mk-reveal grid grid-cols-[40px_minmax(0,1fr)] gap-4 py-5"
              style={{ "--i": i + 1 } as CSSProperties}
            >
              <span className="bg-card border-border text-accent-foreground grid size-10 place-items-center rounded-xl border">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1 text-pretty text-[15.5px]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
