import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { Bento } from "@/components/marketing/bento";
import { Cta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { PhoneVisual } from "@/components/marketing/phone-visual";
import { Steps } from "@/components/marketing/steps";
import { StoreButtons } from "@/components/store-buttons";
import { Button } from "@/components/ui/button";
import { formatDate, getAllPosts } from "@/lib/blog";
import { getServerSession } from "@/lib/auth-server";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "RozliczKorki: kalendarz i rozliczenia korepetycji",
  description:
    "Prowadź korki bez zeszytu: kalendarz zajęć, odznaczanie płatności i podgląd zarobków na żywo. Za darmo, po polsku, na telefon i w przeglądarce.",
  alternates: { canonical: SITE_URL },
};

function d(i: number) {
  return { "--i": i } as CSSProperties;
}

export default async function MarketingPage() {
  const [session, posts] = await Promise.all([getServerSession(), getAllPosts()]);
  const latestPosts = posts.slice(0, 2);
  const ctaHref = session ? "/dashboard" : "/register";
  const ctaLabel = session ? "Przejdź do panelu" : "Zacznij za darmo";

  return (
    <div className="relative isolate overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-dotgrid mask-fade-radial absolute inset-x-0 top-0 h-[40rem] opacity-60" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-28 px-6 py-8 sm:gap-36">
        <MarketingHeader />

        <section className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="flex flex-col gap-6">
            <p
              className="mk-rise text-muted-foreground flex items-center gap-2 text-sm"
              style={d(0)}
            >
              <span className="bg-success relative flex size-2 rounded-full">
                <span className="bg-success mk-blink absolute inset-0 rounded-full blur-[2px]" />
              </span>
              Android jest w Google Play
              <span className="text-border-solid">/</span>
              <span className="font-mono-ui text-xs">iOS w drodze</span>
            </p>
            <h1
              className="mk-rise text-balance text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl"
              style={d(1)}
            >
              Korki pod pełną kontrolą, bez zeszytu.
            </h1>
            <p
              className="mk-rise text-muted-foreground max-w-md text-pretty text-lg"
              style={d(2)}
            >
              Kalendarz zajęć, odklikiwanie lekcji i finanse, które liczą się same. Wiesz,
              kto zapłacił, kto zalega i ile zarobisz w tym miesiącu.
            </p>
            <div className="mk-rise flex flex-wrap items-center gap-3" style={d(3)}>
              <Button size="lg" className="h-11 px-5 text-base" asChild>
                <Link href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-11 px-4 text-base" asChild>
                <Link href="#jak-to-dziala">Jak to działa</Link>
              </Button>
            </div>
            <dl
              className="mk-rise font-mono-ui text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-xs"
              style={d(4)}
            >
              <div className="flex gap-1.5">
                <dt>cena</dt>
                <dd className="text-foreground">0 zł</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>karta</dt>
                <dd className="text-foreground">nie</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>język</dt>
                <dd className="text-foreground">polski</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>konfiguracja</dt>
                <dd className="text-foreground">~5 min</dd>
              </div>
            </dl>
          </div>

          <HeroVisual />
        </section>

        <section
          id="aplikacja"
          className="border-border-solid relative grid scroll-mt-24 gap-12 overflow-hidden rounded-3xl border p-8 sm:p-12 lg:grid-cols-[1.05fr_auto] lg:items-center"
        >
          <div
            aria-hidden
            className="bg-linegrid mask-fade-b absolute inset-0 -z-10 opacity-50"
          />
          <div className="flex flex-col gap-6">
            <SectionHeading
              index="I"
              eyebrow="Aplikacja mobilna"
              title="Korki masz w kieszeni, nie w laptopie."
              description="Android jest już w Google Play. Te same zajęcia, te same statystyki, plus push przed lekcją i odklikanie płatności zaraz po niej."
            />
            <ul className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
              <AppPoint>Powiadomienia push przed zajęciami</AppPoint>
              <AppPoint>Odklikanie lekcji w dwa dotknięcia</AppPoint>
              <AppPoint>Dane te same co w przeglądarce</AppPoint>
              <AppPoint>Widżet z dzisiejszym planem</AppPoint>
            </ul>
            <StoreButtons />
          </div>

          <PhoneVisual className="lg:pl-6" />
        </section>

        <section id="jak-to-dziala" className="flex scroll-mt-24 flex-col gap-12">
          <SectionHeading
            index="II"
            eyebrow="Jak to działa"
            title="Trzy kroki i masz spokój do końca semestru."
            description="Konfiguracja zajmuje około pięciu minut. Potem zostaje Ci tylko odklikiwanie lekcji po zajęciach."
          />
          <Steps />
        </section>

        <section id="funkcje" className="flex scroll-mt-24 flex-col gap-12">
          <SectionHeading
            index="III"
            eyebrow="Funkcje"
            title="Wszystko, czego korepetytor naprawdę potrzebuje."
            description="Bez modułów, których nigdy nie otworzysz. Osiem rzeczy, które robią robotę."
          />
          <Bento />
        </section>

        {latestPosts.length > 0 && (
          <section className="flex flex-col gap-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                index="IV"
                eyebrow="Blog"
                title="Korki bez firmy, podatki, formalności."
                description="Rozpisujemy to, o co pytacie najczęściej, z podstawą prawną i linkami do źródeł."
              />
              <Button variant="ghost" asChild>
                <Link href="/blog">
                  Wszystkie wpisy
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ol className="border-border-solid divide-border-solid divide-y border-y">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group grid gap-3 py-6 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-6"
                  >
                    <time
                      dateTime={post.date}
                      className="font-mono-ui text-muted-foreground text-xs"
                    >
                      {formatDate(post.date)}
                    </time>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="group-hover:text-primary text-balance text-lg font-semibold tracking-tight transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-pretty text-sm">
                        {post.description}
                      </p>
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 text-xs transition-colors">
                      {post.readingTime} min
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section id="faq" className="grid scroll-mt-24 gap-10 lg:grid-cols-[1fr_2fr]">
          <SectionHeading index="V" eyebrow="FAQ" title="Częste pytania." />
          <Faq />
        </section>

        <Cta href={ctaHref} label={ctaLabel} />

        <MarketingFooter />
      </div>
    </div>
  );
}

function AppPoint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="text-primary mt-0.5 size-4 shrink-0" />
      {children}
    </li>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="font-mono-ui text-muted-foreground flex items-center gap-2 text-xs">
        <span className="text-primary">{index}</span>
        <span className="bg-border-solid h-px w-6" />
        {eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground text-pretty text-lg">{description}</p>
      )}
    </div>
  );
}
