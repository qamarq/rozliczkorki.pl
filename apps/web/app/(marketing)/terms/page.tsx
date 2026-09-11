import Link from "next/link";

export const metadata = {
  title: "Regulamin — RozliczKorki",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-brand-gradient text-lg font-bold">
          RozliczKorki
        </Link>
        <Link href="/" className="text-muted-foreground text-sm underline">
          Wróć na stronę główną
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulamin</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Ostatnia aktualizacja: 10 września 2026
          </p>
        </div>

        <Section title="1. Postanowienia ogólne">
          <p>
            Niniejszy regulamin określa zasady korzystania z aplikacji RozliczKorki
            (strona internetowa rozliczkorki.pl oraz aplikacja mobilna, dalej „Aplikacja")
            służącej do prowadzenia kalendarza korepetycji, ewidencji uczniów, stawek i
            rozliczeń płatności. Korzystając z Aplikacji, akceptujesz niniejszy regulamin.
          </p>
        </Section>

        <Section title="2. Konto użytkownika">
          <List
            items={[
              "Do korzystania z Aplikacji potrzebne jest założenie konta (e-mail i hasło, logowanie przez Google lub kluczem dostępu).",
              "Jesteś odpowiedzialny(a) za zachowanie poufności danych logowania i za wszystkie działania wykonane na Twoim koncie.",
              "Aplikacja jest przeznaczona dla osób pełnoletnich prowadzących korepetycje lub zajęcia edukacyjne we własnym imieniu.",
            ]}
          />
        </Section>

        <Section title="3. Zakres usługi">
          <p>
            Aplikacja umożliwia planowanie zajęć, oznaczanie ich statusu i płatności,
            zarządzanie listą uczniów i stawek oraz podgląd statystyk zarobków. Aplikacja
            jest narzędziem organizacyjnym — nie pośredniczy w płatnościach między Tobą a
            Twoimi uczniami/rodzicami i nie ponosi odpowiedzialności za rozliczenia
            dokonywane poza Aplikacją (gotówka, przelew, BLIK itp.).
          </p>
        </Section>

        <Section title="4. Dane wprowadzane przez użytkownika">
          <p>
            Odpowiadasz za zgodność z prawem danych, które wprowadzasz do Aplikacji, w tym
            danych osobowych swoich uczniów. Wprowadzając dane ucznia, oświadczasz, że
            posiadasz do tego podstawę prawną (np. zgodę rodzica/opiekuna lub umowę o
            korepetycje). Szczegóły dotyczące przetwarzania danych znajdziesz w{" "}
            <Link href="/privacy" className="text-primary underline">
              Polityce prywatności
            </Link>
            .
          </p>
        </Section>

        <Section title="5. Plany i płatności za Aplikację">
          <p>
            Aktualny zakres funkcji, ewentualny okres próbny oraz cennik dostępu do
            Aplikacji podane są na stronie rozliczkorki.pl lub w Aplikacji. Zastrzegamy
            sobie prawo do zmiany cennika z odpowiednim wyprzedzeniem, z poszanowaniem
            praw użytkowników posiadających aktywne opłacone okresy.
          </p>
        </Section>

        <Section title="6. Dostępność i zmiany w Aplikacji">
          <p>
            Dokładamy starań, aby Aplikacja działała nieprzerwanie, ale nie gwarantujemy
            100% dostępności (np. ze względu na prace serwisowe, awarie dostawców
            infrastruktury). Możemy rozwijać, zmieniać lub wycofywać poszczególne funkcje
            Aplikacji.
          </p>
        </Section>

        <Section title="7. Zakończenie korzystania z Aplikacji">
          <p>
            Możesz w każdej chwili usunąć swoje konto samodzielnie w ustawieniach
            Aplikacji (menu użytkownika → Ustawienia → Usuwanie konta); usunięcie
            potwierdzasz linkiem wysłanym na Twój adres e-mail. Spowoduje to usunięcie
            Twoich danych zgodnie z Polityką prywatności. Zastrzegamy sobie prawo do
            zawieszenia lub usunięcia konta w przypadku naruszenia niniejszego regulaminu
            lub obowiązującego prawa.
          </p>
        </Section>

        <Section title="8. Odpowiedzialność">
          <p>
            Aplikacja jest udostępniana „tak jak jest". W zakresie dozwolonym przez prawo
            nie ponosimy odpowiedzialności za szkody wynikające z niedostępności
            Aplikacji, utraty danych wynikającej z przyczyn niezależnych od nas ani za
            błędne dane wprowadzone przez użytkownika (np. nieprawidłowe stawki lub
            terminy zajęć).
          </p>
        </Section>

        <Section title="9. Kontakt i reklamacje">
          <p>
            Reklamacje dotyczące działania Aplikacji możesz zgłaszać mailowo — adres
            kontaktowy znajdziesz w ustawieniach Aplikacji. Odpowiadamy na reklamacje w
            terminie 14 dni od zgłoszenia.
          </p>
        </Section>

        <Section title="10. Zmiany regulaminu">
          <p>
            O zmianach regulaminu poinformujemy z wyprzedzeniem w Aplikacji lub mailowo.
            Dalsze korzystanie z Aplikacji po wejściu zmian w życie oznacza ich
            akceptację.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground flex flex-col gap-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
