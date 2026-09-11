import Link from "next/link";
import { Logo } from "@/components/logo";
import { AppStoreIcon, GooglePlayIcon } from "@/components/store-icons";
import { GOOGLE_PLAY_URL } from "@/lib/site";

const COLUMNS = [
  {
    title: "Produkt",
    links: [
      { label: "Funkcje", href: "/#funkcje" },
      { label: "Jak to działa", href: "/#jak-to-dziala" },
      { label: "Aplikacja Android", href: GOOGLE_PLAY_URL, external: true },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Zasoby",
    links: [
      { label: "Blog", href: "/blog" },
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

export function MarketingFooter() {
  return (
    <footer className="border-border-solid bg-card/40 relative overflow-hidden rounded-3xl border">
      <div className="border-border-solid bg-card relative z-10 m-3 rounded-2xl border p-6 sm:m-5 sm:p-10">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="flex max-w-sm flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="size-7" />
              <span className="text-lg font-bold tracking-tight">RozliczKorki</span>
            </Link>
            <p className="text-muted-foreground text-pretty text-sm leading-relaxed">
              Kalendarz, płatności i zarobki korepetytora w jednym miejscu. Zamiast
              zeszytu, arkusza i liczenia z pamięci.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Google Play"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GooglePlayIcon className="size-5" />
              </a>
              <span
                aria-label="App Store — wkrótce"
                title="App Store — wkrótce"
                className="text-muted-foreground/40 cursor-default"
              >
                <AppStoreIcon className="size-5 rounded-[22%]" />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-14">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <span className="text-sm font-semibold">{col.title}</span>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-border-solid text-muted-foreground mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs">
          <span>
            © {new Date().getFullYear()} RozliczKorki. Wszystkie prawa zastrzeżone.
          </span>
          <span className="font-mono-ui">Zrobione w Polsce · dla korepetytorów</span>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none relative -mt-10 h-28 select-none overflow-hidden sm:-mt-14 sm:h-44"
      >
        <span className="from-foreground/12 mask-fade-b absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap bg-gradient-to-b to-transparent bg-clip-text text-[19vw] font-bold leading-none tracking-tighter text-transparent lg:text-[9.25rem]">
          RozliczKorki
        </span>
      </div>
    </footer>
  );
}
