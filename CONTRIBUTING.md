# Kontrybucje

Dzięki, że chcesz pomóc przy RozliczKorki! Zanim otworzysz pull request, przeczytaj
poniższe zasady.

## Jak zgłosić zmianę

1. Zrób fork repozytorium i utwórz gałąź od `main`.
2. Przed wypchnięciem uruchom te same sprawdzenia co CI:

   ```sh
   pnpm format:fix
   pnpm lint:typecheck
   pnpm lint:check
   pnpm format:check
   ```

3. Otwórz pull request z krótkim opisem zmiany i potwierdź zgodę na warunki licencyjne
   z sekcji poniżej.

## Warunki licencyjne kontrybucji

Projekt jest udostępniany na licencji [GNU AGPL-3.0](LICENSE), a jego autor
(Kamil Marczak) publikuje aplikację również w App Store i Google Play, których warunki
nie są zgodne z AGPL. Dlatego każda kontrybucja wymaga poniższej zgody.

Otwierając pull request lub w inny sposób przesyłając kod, dokumentację, grafiki albo
inne materiały („Kontrybucja”) do tego repozytorium, oświadczasz i zgadzasz się, że:

1. **Autorstwo.** Kontrybucja jest Twoim oryginalnym utworem albo masz prawo ją
   przekazać na warunkach opisanych poniżej. Jeśli zawiera cudzy kod, jest on na
   licencji zgodnej z AGPL-3.0 i wyraźnie go oznaczasz.
2. **Licencja dla autora projektu.** Udzielasz Kamilowi Marczakowi nieodpłatnej,
   niewyłącznej, nieodwołalnej, nieograniczonej terytorialnie i czasowo licencji
   do Kontrybucji, z prawem udzielania dalszych licencji (sublicencji), obejmującej
   wszystkie znane w chwili jej przesłania pola eksploatacji, w szczególności:
   - utrwalanie i zwielokrotnianie dowolną techniką,
   - modyfikowanie, tłumaczenie i łączenie z innymi utworami,
   - rozpowszechnianie, w tym publiczne udostępnianie w internecie, w sklepach
     z aplikacjami (App Store, Google Play) i jako usługa sieciowa (SaaS),
   - udostępnianie na dowolnej licencji, także innej niż AGPL-3.0, w tym zamkniętej
     lub komercyjnej.
3. **Prawa zależne.** Zezwalasz na wykonywanie praw zależnych do Kontrybucji
   i korzystanie z nich w zakresie z punktu 2.
4. **Prawa osobiste.** Zobowiązujesz się nie wykonywać autorskich praw osobistych
   w sposób, który ograniczałby korzystanie z Kontrybucji w zakresie z punktu 2
   (np. przez sprzeciw wobec modyfikacji albo publikacji bez oznaczenia autorstwa).
   Twoje autorstwo pozostaje widoczne w historii repozytorium.
5. **Licencja publiczna.** Niezależnie od powyższego Kontrybucja jest też dostępna
   dla wszystkich na licencji AGPL-3.0, tak jak reszta projektu.
6. **Brak wynagrodzenia i gwarancji.** Nie przysługuje Ci za to wynagrodzenie,
   a Kontrybucję przekazujesz „tak jak jest”, bez gwarancji.

Zachowujesz prawa autorskie do swojej Kontrybucji i możesz z niej korzystać w dowolny
sposób. Jeśli nie zgadzasz się z tymi warunkami, nie otwieraj pull requesta.
