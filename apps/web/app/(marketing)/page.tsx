import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { Cta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { Ledger } from "@/components/marketing/ledger";
import { NotebookCompare } from "@/components/marketing/notebook-compare";
import { OpenSource } from "@/components/marketing/open-source";
import { PageTransition } from "@/components/marketing/page-transition";
import { PanelLink } from "@/components/marketing/panel-link";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Timeline } from "@/components/marketing/timeline";
import { StoreButtons } from "@/components/store-buttons";
import { formatDate, getAllPosts } from "@/lib/blog";
import { getServerSession } from "@/lib/auth-server";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "RozliczKorki: kalendarz i rozliczenia korepetycji",
  description:
    "Prowadź korki bez zeszytu: kalendarz zajęć, odznaczanie płatności i podgląd zarobków na żywo. Za darmo, po polsku, na telefon i w przeglądarce.",
  alternates: { canonical: SITE_URL },
};

const FACTS = ["0 zł, bez karty", "iPhone, Android i przeglądarka", "Otwarty kod"];

function d(i: number) {
  return { "--i": i } as CSSProperties;
}

export default async function MarketingPage() {
  const [session, posts] = await Promise.all([getServerSession(), getAllPosts()]);
  const latestPosts = posts.slice(0, 2);
  const ctaHref = session ? "/dashboard" : "/register";
  const ctaLabel = session ? "Przejdź do panelu" : "Załóż konto za darmo";

  return (
    <PageTransition>
      <div className="site-container">
        <MarketingHeader />
      </div>

      <section className="site-container grid items-center gap-12 pb-4 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:pt-14">
        <div className="flex flex-col items-start">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="mk-rise border-border bg-card text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors"
            style={d(0)}
          >
            <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold">
              Nowość
            </span>
            <span className="truncate">RozliczKorki jest już na iPhonie</span>
          </a>
          <h1
            className="font-display mk-rise mt-6 text-balance text-[2.6rem] font-semibold leading-none tracking-[-0.018em] sm:text-6xl xl:text-[4.4rem]"
            style={d(1)}
          >
            Zeszyt z&nbsp;korkami możesz już zamknąć.
          </h1>
          <p
            className="text-muted-foreground mk-rise mt-6 max-w-xl text-pretty text-lg sm:text-[1.2rem]"
            style={d(2)}
          >
            RozliczKorki pilnuje planu lekcji i płatności. Po zajęciach klikasz „odbyło
            się” i „zapłacone”, a na koniec miesiąca wiesz, ile wpadło i kto jeszcze nie
            zapłacił.
          </p>
          <div className="mk-rise mt-8" style={d(3)}>
            <PanelLink
              href={ctaHref}
              className="bg-primary text-primary-foreground group inline-flex h-12 items-center gap-2 rounded-xl px-5 text-base font-semibold shadow-[0_10px_24px_-12px_rgb(79_70_229/0.7)] transition-[filter,box-shadow] hover:brightness-110"
            >
              {ctaLabel}
              <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" />
            </PanelLink>
          </div>
          <div
            className="mk-rise mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"
            style={d(4)}
          >
            <span className="text-muted-foreground text-sm">albo pobierz aplikację:</span>
            <StoreButtons />
          </div>
          <ul
            className="text-muted-foreground mk-rise mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-sm"
            style={d(5)}
          >
            {FACTS.map((fact) => (
              <li key={fact} className="flex items-center gap-1.5">
                <Check className="text-success size-4" strokeWidth={2.4} />
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="mk-rise" style={d(3)}>
          <NotebookCompare />
        </div>
      </section>

      <section id="funkcje" className="site-container scroll-mt-6 pt-24 sm:pt-28">
        <SectionHeading
          title="Przed lekcją, po lekcji i na koniec miesiąca."
          description="Uczniów i zajęcia cykliczne wpisujesz raz, co zajmuje około pięciu minut. Potem aplikacja odzywa się tylko wtedy, kiedy jest potrzebna."
        />
        <Timeline />
      </section>

      <section className="site-container pb-24 pt-28 sm:pb-28 sm:pt-32">
        <SectionHeading
          title="Rzeczy, których zeszyt nie policzy."
          description="Przydają się, kiedy uczniów jest więcej niż kilku, a część zajęć idzie przez szkołę językową."
        />
        <Ledger />
      </section>

      <OpenSource />

      {latestPosts.length > 0 && (
        <section className="site-container pt-24 sm:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <SectionHeading
              title="Korki bez firmy, podatki i formalności."
              description="Rozpisujemy to, o co pytacie najczęściej, z podstawą prawną i linkami do źródeł."
            />
            <Link
              href="/blog"
              className="text-accent-foreground group inline-flex items-center gap-1.5 font-semibold"
            >
              Wszystkie wpisy
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <Reveal className="border-border-solid divide-border-solid mt-11 divide-y border-y">
            {latestPosts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="mk-reveal group grid gap-2 py-7 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-7"
                style={d(i)}
              >
                <time dateTime={post.date} className="text-muted-foreground text-sm">
                  {formatDate(post.date)}
                </time>
                <div>
                  <h3 className="font-display group-hover:text-accent-foreground text-balance text-2xl font-semibold leading-tight transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
                    {post.description}
                  </p>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground flex items-center gap-1 whitespace-nowrap text-sm transition-colors">
                  {post.readingTime} min czytania
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      <section
        id="faq"
        className="site-container grid scroll-mt-6 gap-8 pt-24 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12"
      >
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-[2rem] font-semibold leading-[1.06] tracking-[-0.012em] sm:text-5xl">
            Częste pytania.
          </h2>
          <p className="text-muted-foreground">
            Nie ma tu odpowiedzi? Zajrzyj na{" "}
            <Link
              href="/blog"
              className="text-accent-foreground underline-offset-4 hover:underline"
            >
              bloga
            </Link>
            .
          </p>
        </div>
        <Faq />
      </section>

      <div className="site-container pb-20 pt-24 sm:pt-28">
        <Cta href={ctaHref} label={ctaLabel} />
      </div>

      <div className="site-container">
        <MarketingFooter />
      </div>
    </PageTransition>
  );
}
