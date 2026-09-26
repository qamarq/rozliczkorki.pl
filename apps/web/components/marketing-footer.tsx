import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_STORE_URL, GITHUB_URL, GOOGLE_PLAY_URL } from "@/lib/site";

const COLUMNS = [
  {
    title: "Produkt",
    links: [
      { label: "Funkcje", href: "/#funkcje" },
      { label: "Aplikacja na iPhone'a", href: APP_STORE_URL, external: true },
      { label: "Aplikacja na Androida", href: GOOGLE_PLAY_URL, external: true },
      { label: "Pytania", href: "/#faq" },
    ],
  },
  {
    title: "Zasoby",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Kod źródłowy", href: GITHUB_URL, external: true },
      { label: "Załóż konto", href: "/register" },
      { label: "Zaloguj się", href: "/login" },
    ],
  },
  {
    title: "Prawne",
    links: [
      { label: "Polityka prywatności", href: "/privacy" },
      { label: "Regulamin", href: "/terms" },
      { label: "Usunięcie konta", href: "/delete-account" },
    ],
  },
];

const LINK_CLASS = "hover:text-primary transition-colors";

export function MarketingFooter() {
  return (
    <footer className="border-border-solid border-t pb-10 pt-12 text-[15px]">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex max-w-xs flex-col gap-4 lg:col-span-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          >
            <Logo className="size-8" />
            RozliczKorki
          </Link>
          <p className="text-muted-foreground text-pretty">
            Kalendarz, płatności i zarobki korepetytora w jednym miejscu. Zamiast zeszytu,
            arkusza i liczenia z pamięci.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h2 className="text-muted-foreground font-body text-xs font-semibold uppercase tracking-[0.08em]">
              {column.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className={LINK_CLASS}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border text-muted-foreground mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-sm">
        <span>
          © {new Date().getFullYear()} RozliczKorki. Kod na licencji{" "}
          <a
            href={`${GITHUB_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
          >
            AGPL-3.0
          </a>
          .
        </span>
        <span>
          Made with ❤️ by{" "}
          <a
            href="https://kamilmarczak.pl"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
          >
            Kamil Marczak
          </a>
        </span>
      </div>
    </footer>
  );
}
