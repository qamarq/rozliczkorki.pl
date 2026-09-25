import Link from "next/link";
import { Logo } from "@/components/logo";
import { PanelLink } from "@/components/marketing/panel-link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth-server";

const NAV = [
  { label: "Funkcje", href: "/#funkcje" },
  { label: "Otwarty kod", href: "/#otwarty-kod" },
  { label: "Blog", href: "/blog" },
  { label: "Pytania", href: "/#faq" },
];

export async function MarketingHeader() {
  const session = await getServerSession();

  return (
    <header
      className="flex items-center justify-between gap-3 py-5"
      style={{ viewTransitionName: "site-header" }}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 text-base font-bold tracking-tight sm:text-lg"
      >
        <Logo className="size-7 sm:size-8" />
        RozliczKorki
      </Link>
      <nav
        aria-label="Główna"
        className="text-muted-foreground hidden items-center gap-7 text-[15px] lg:flex"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:text-foreground transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 sm:gap-4">
        {session ? (
          <Button
            asChild
            className="h-9 rounded-[10px] px-3.5 text-sm font-semibold sm:h-10 sm:text-[15px]"
          >
            <PanelLink href="/dashboard">Przejdź do panelu</PanelLink>
          </Button>
        ) : (
          <>
            <Link
              href="/login"
              className="hover:text-primary whitespace-nowrap text-sm font-medium transition-colors sm:text-[15px]"
            >
              Zaloguj się
            </Link>
            <Button
              asChild
              className="h-9 rounded-[10px] px-3 text-sm font-semibold sm:h-10 sm:px-4 sm:text-[15px]"
            >
              <Link href="/register">Załóż konto</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
