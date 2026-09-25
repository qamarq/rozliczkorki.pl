import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/marketing/legal";

export const metadata = {
  title: "Regulamin | RozliczKorki",
};

export default function TermsPage() {
  return (
    <LegalPage
      current="/terms"
      title="Regulamin"
      meta="Ostatnia aktualizacja: 10 września 2026"
    >
      <LegalSection title="1. Postanowienia ogólne">
        <p>
          Niniejszy regulamin określa zasady korzystania z aplikacji RozliczKorki (strona
          internetowa rozliczkorki.pl oraz aplikacja mobilna, dalej „Aplikacja”) służącej
          do prowadzenia kalendarza korepetycji, ewidencji uczniów, stawek i rozliczeń
          płatności. Korzystając z Aplikacji, akceptujesz niniejszy regulamin.
        </p>
      </LegalSection>

      <LegalSection title="2. Konto użytkownika">
        <LegalList
          items={[
            "Do korzystania z Aplikacji potrzebne jest założenie konta (e-mail i hasło, logowanie przez Google lub kluczem dostępu).",
            "Jesteś odpowiedzialny(a) za zachowanie poufności danych logowania i za wszystkie działania wykonane na Twoim koncie.",
            "Aplikacja jest przeznaczona dla osób pełnoletnich prowadzących korepetycje lub zajęcia edukacyjne we własnym imieniu.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Zakres usługi">
        <p>
          Aplikacja umożliwia planowanie zajęć, oznaczanie ich statusu i płatności,
          zarządzanie listą uczniów i stawek oraz podgląd statystyk zarobków. Aplikacja
          jest narzędziem organizacyjnym. Nie pośredniczy w płatnościach między Tobą a
          Twoimi uczniami/rodzicami i nie ponosi odpowiedzialności za rozliczenia
          dokonywane poza Aplikacją (gotówka, przelew, BLIK itp.).
        </p>
      </LegalSection>

      <LegalSection title="4. Dane wprowadzane przez użytkownika">
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
      </LegalSection>

      <LegalSection title="5. Plany i płatności za Aplikację">
        <p>
          Aktualny zakres funkcji, ewentualny okres próbny oraz cennik dostępu do
          Aplikacji podane są na stronie rozliczkorki.pl lub w Aplikacji. Zastrzegamy
          sobie prawo do zmiany cennika z odpowiednim wyprzedzeniem, z poszanowaniem praw
          użytkowników posiadających aktywne opłacone okresy.
        </p>
      </LegalSection>

      <LegalSection title="6. Dostępność i zmiany w Aplikacji">
        <p>
          Dokładamy starań, aby Aplikacja działała nieprzerwanie, ale nie gwarantujemy
          100% dostępności (np. ze względu na prace serwisowe, awarie dostawców
          infrastruktury). Możemy rozwijać, zmieniać lub wycofywać poszczególne funkcje
          Aplikacji.
        </p>
      </LegalSection>

      <LegalSection title="7. Zakończenie korzystania z Aplikacji">
        <p>
          Możesz w każdej chwili usunąć swoje konto samodzielnie w ustawieniach Aplikacji
          (menu użytkownika → Ustawienia → Usuwanie konta); usunięcie potwierdzasz linkiem
          wysłanym na Twój adres e-mail. Spowoduje to usunięcie Twoich danych zgodnie z
          Polityką prywatności. Zastrzegamy sobie prawo do zawieszenia lub usunięcia konta
          w przypadku naruszenia niniejszego regulaminu lub obowiązującego prawa.
        </p>
      </LegalSection>

      <LegalSection title="8. Odpowiedzialność">
        <p>
          Aplikacja jest udostępniana „tak jak jest”. W zakresie dozwolonym przez prawo
          nie ponosimy odpowiedzialności za szkody wynikające z niedostępności Aplikacji,
          utraty danych wynikającej z przyczyn niezależnych od nas ani za błędne dane
          wprowadzone przez użytkownika (np. nieprawidłowe stawki lub terminy zajęć).
        </p>
      </LegalSection>

      <LegalSection title="9. Kontakt i reklamacje">
        <p>
          Reklamacje dotyczące działania Aplikacji możesz zgłaszać mailowo. Adres
          kontaktowy znajdziesz w ustawieniach Aplikacji. Odpowiadamy na reklamacje w
          terminie 14 dni od zgłoszenia.
        </p>
      </LegalSection>

      <LegalSection title="10. Zmiany regulaminu">
        <p>
          O zmianach regulaminu poinformujemy z wyprzedzeniem w Aplikacji lub mailowo.
          Dalsze korzystanie z Aplikacji po wejściu zmian w życie oznacza ich akceptację.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
