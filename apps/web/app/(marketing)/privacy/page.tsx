import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/marketing/legal";

export const metadata = {
  title: "Polityka prywatności | RozliczKorki",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title="Polityka prywatności"
      meta="Ostatnia aktualizacja: 21 września 2026"
    >
      <LegalSection title="1. Kto jest administratorem danych">
        <p>
          Administratorem danych osobowych przetwarzanych w aplikacji RozliczKorki
          (dostępnej pod adresem rozliczkorki.pl oraz jako aplikacja mobilna) jest twórca
          aplikacji RozliczKorki. W sprawach dotyczących ochrony danych możesz
          skontaktować się mailowo pod adresem podanym w ustawieniach aplikacji lub na
          stronie kontaktowej.
        </p>
      </LegalSection>

      <LegalSection title="2. Jakie dane zbieramy">
        <p>Aby aplikacja mogła działać, przetwarzamy:</p>
        <LegalList
          items={[
            "Dane konta: imię, adres e-mail, hasło (zahaszowane) lub identyfikator logowania Google, oraz (jeśli włączysz logowanie kluczem dostępu) dane techniczne passkey (klucz publiczny, nie masz dostępu do klucza prywatnego, ten zostaje na Twoim urządzeniu).",
            "Dane Twoich uczniów, które sam(a) wprowadzasz: imię i nazwisko, adres, opcjonalny numer telefonu, typ zajęć i stawki godzinowe.",
            "Dane o zajęciach: terminy, czas trwania, status (zaplanowane/odbyte/odwołane), status i sposób płatności, notatki, które sam(a) dodajesz.",
            "Dane techniczne: adres IP, informacje o urządzeniu i przeglądarce, identyfikator sesji, potrzebne do zalogowania i utrzymania bezpieczeństwa konta.",
            "Token powiadomień push (jeśli włączysz powiadomienia w aplikacji mobilnej), potrzebny wyłącznie do wysyłki przypomnień o zajęciach i płatnościach.",
            "Dane analityczne (jeśli nie wyłączysz analityki): zdarzenia opisujące korzystanie z aplikacji — rejestracja i sposób logowania, ukończone kroki konfiguracji, dodanie pierwszego ucznia, zaplanowanie i odznaczenie zajęć, wyświetlenie podsumowania finansowego — wraz z identyfikatorem konta, wewnętrznymi identyfikatorami ucznia i zajęć, platformą (web/iOS/Android), językiem przeglądarki, źródłem wejścia na stronę oraz danymi technicznymi urządzenia zbieranymi przez SDK analityczny. Nie wysyłamy tam imion ani adresów uczniów.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. W jakim celu przetwarzamy dane">
        <LegalList
          items={[
            "Świadczenie usługi: prowadzenie kalendarza zajęć, rozliczeń i statystyk zarobków (podstawa: wykonanie umowy, art. 6 ust. 1 lit. b RODO).",
            "Logowanie i bezpieczeństwo konta, w tym logowanie przez Google i kluczem dostępu (podstawa: wykonanie umowy oraz prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO).",
            "Wysyłka przypomnień push i e-mail o zbliżających się zajęciach lub zaległych płatnościach (podstawa: wykonanie umowy).",
            "Utrzymanie i rozwój aplikacji, w tym wykrywanie i naprawa błędów (podstawa: prawnie uzasadniony interes).",
            "Analityka korzystania z aplikacji w narzędziu Mixpanel: statystyki użycia funkcji, wykrywanie miejsc, w których użytkownicy się gubią, oraz ulepszanie aplikacji (podstawa: prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO; masz prawo sprzeciwu wobec tego przetwarzania).",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Dane Twoich uczniów">
        <p>
          Dane uczniów (i ewentualnie ich rodziców/opiekunów) wprowadzasz Ty jako
          korepetytor. W tym zakresie to Ty jesteś administratorem tych danych, a
          RozliczKorki pełni rolę podmiotu przetwarzającego, który przechowuje te dane
          wyłącznie po to, żeby wyświetlić Ci je z powrotem w aplikacji. Nie
          wykorzystujemy tych danych do żadnych własnych celów (marketingu, sprzedaży,
          profilowania) i nie udostępniamy ich osobom trzecim poza dostawcami
          infrastruktury wskazanymi w punkcie 6.
        </p>
      </LegalSection>

      <LegalSection title="5. Okres przechowywania">
        <p>
          Dane przechowujemy przez czas posiadania aktywnego konta. Po usunięciu konta
          dane są usuwane z bazy produkcyjnej w ciągu 30 dni, z wyjątkiem sytuacji, gdy
          dłuższe przechowywanie wynika z przepisów prawa (np. rozliczeń podatkowych).
        </p>
      </LegalSection>

      <LegalSection title="6. Podmioty, którym powierzamy przetwarzanie danych">
        <LegalList
          items={[
            "Dostawca hostingu aplikacji webowej (Vercel): przechowywanie i udostępnianie aplikacji.",
            "Dostawca bazy danych (Neon, PostgreSQL): przechowywanie danych konta, uczniów i zajęć.",
            "Google: jeśli zdecydujesz się na logowanie przez Google (weryfikacja tożsamości).",
            "Dostawca powiadomień push (Expo/Apple/Google): wyłącznie w celu doręczenia powiadomień, jeśli je włączysz.",
            "Mixpanel (Mixpanel, Inc.): zewnętrzny dostawca analityki, który w naszym imieniu zbiera i przetwarza zdarzenia opisane w punkcie 2. Dane mogą być przetwarzane poza Europejskim Obszarem Gospodarczym, w oparciu o standardowe klauzule umowne zatwierdzone przez Komisję Europejską.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Analityka i jej wyłączenie">
        <p>
          Do analityki używamy zewnętrznej usługi Mixpanel. Zbieramy wyłącznie zdarzenia
          wymienione w punkcie 2 — nie nagrywamy ekranu, nie zbieramy treści notatek ani
          danych osobowych Twoich uczniów, nie używamy tych danych do reklam i nie
          sprzedajemy ich nikomu. W każdej chwili możesz wnieść sprzeciw wobec analityki —
          napisz do nas na adres kontaktowy, a wyłączymy zbieranie zdarzeń dla Twojego
          konta. W przeglądarce respektujemy też ustawienie „Do Not Track”.
        </p>
      </LegalSection>

      <LegalSection title="8. Twoje prawa">
        <p>
          Zgodnie z RODO masz prawo do: dostępu do swoich danych, ich sprostowania,
          usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu wobec
          przetwarzania. Konto i wszystkie powiązane dane możesz usunąć samodzielnie w
          ustawieniach aplikacji (menu użytkownika → Ustawienia → Usuwanie konta);
          szczegóły opisaliśmy na stronie{" "}
          <Link href="/delete-account" className="text-primary underline">
            usuwania konta
          </Link>
          . Masz też prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
        </p>
      </LegalSection>

      <LegalSection title="9. Bezpieczeństwo">
        <p>
          Hasła przechowujemy w postaci zahaszowanej, połączenia z aplikacją są szyfrowane
          (HTTPS/TLS), a dostęp do bazy danych jest ograniczony wyłącznie do
          infrastruktury aplikacji. Logowanie kluczem dostępu (passkey) opiera się o
          standard WebAuthn. Twój klucz prywatny nigdy nie opuszcza urządzenia.
        </p>
      </LegalSection>

      <LegalSection title="10. Zmiany polityki prywatności">
        <p>
          Jeśli zmienimy tę politykę, poinformujemy o tym w aplikacji lub mailowo, z
          odpowiednim wyprzedzeniem przed wejściem zmian w życie.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
