import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { PageTransition } from "@/components/marketing/page-transition";

const DOCUMENTS = [
  { href: "/terms", label: "Regulamin" },
  { href: "/privacy", label: "Polityka prywatności" },
  { href: "/delete-account", label: "Usunięcie konta" },
] as const;

export function LegalPage({
  current,
  title,
  meta,
  children,
}: {
  current: (typeof DOCUMENTS)[number]["href"];
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <PageTransition>
      <div className="site-container">
        <MarketingHeader />
      </div>

      <div className="site-container grid gap-10 pb-24 pt-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:pt-16">
        <nav
          aria-label="Dokumenty"
          className="flex gap-1 overflow-x-auto lg:sticky lg:top-8 lg:flex-col lg:self-start"
        >
          {DOCUMENTS.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              aria-current={doc.href === current ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg border px-3 py-2 text-[15px] transition-colors",
                doc.href === current
                  ? "border-border bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {doc.label}
            </Link>
          ))}
        </nav>

        <article className="max-w-3xl">
          <h1 className="font-display mk-rise text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">{meta}</p>
          <div className="mt-10 flex flex-col gap-9">{children}</div>
        </article>
      </div>

      <div className="site-container">
        <MarketingFooter />
      </div>
    </PageTransition>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[1.4rem] font-semibold leading-tight">{title}</h2>
      <div className="text-muted-foreground [&_a]:text-accent-foreground [&_strong]:text-foreground flex flex-col gap-3 text-pretty text-[15.5px] leading-relaxed [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="marker:text-faint list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
