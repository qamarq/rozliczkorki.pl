const FAQ = [
  {
    q: "Czy RozliczKorki jest darmowe?",
    a: "Tak. Zakładasz konto i korzystasz ze wszystkich funkcji bez opłat. Nie prosimy o kartę.",
  },
  {
    q: "Czy kod aplikacji jest otwarty?",
    a: "Tak. RozliczKorki jest open source na licencji AGPL-3.0. Cały kod aplikacji webowej i mobilnej znajdziesz na GitHubie: github.com/qamarq/rozliczkorki.pl.",
  },
  {
    q: "Czy to program księgowy?",
    a: "Nie. RozliczKorki pilnuje Twojego kalendarza i płatności oraz pokazuje sumy przychodów, ale nie wysyła deklaracji do urzędu ani nie wystawia faktur.",
  },
  {
    q: "Czy muszę mieć firmę, żeby udzielać korepetycji?",
    a: "Najczęściej nie. Do limitu działalności nierejestrowanej wystarczy rozliczenie roczne. Szczegóły, kwoty i podstawę prawną rozpisaliśmy na blogu.",
  },
  {
    q: "Czy działa na telefonie?",
    a: "Tak. Aplikacja jest w Google Play na Androida i w App Store na iPhone'a, a wersja webowa działa na każdym urządzeniu.",
  },
  {
    q: "Co z moimi danymi, jeśli zrezygnuję?",
    a: "Konto razem z całą historią zajęć usuwasz sam(a) w ustawieniach albo przez formularz usunięcia konta. Bez maili i bez proszenia o zgodę.",
  },
];

export function Faq() {
  return (
    <div className="border-border-solid divide-border-solid divide-y border-y">
      {FAQ.map((item, i) => (
        <details key={item.q} className="faq-item group" name="faq" open={i === 0}>
          <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17.5px] font-semibold transition-colors [&::-webkit-details-marker]:hidden">
            {item.q}
            <svg
              viewBox="0 0 20 20"
              className="text-muted-foreground size-5 shrink-0 transition-transform duration-300 group-open:rotate-45"
              aria-hidden
            >
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </summary>
          <p className="text-muted-foreground max-w-2xl text-pretty pb-5 leading-relaxed">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
