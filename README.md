# RozliczKorki

[🇬🇧 English version below](#rozliczkorki-english)

Tracker korepetycji: kalendarz zajęć, status odbycia/płatności, zarobki, uczniowie ze
stawkami w czasie, zajęcia cykliczne i przypomnienia push.

## Struktura

- `apps/web` — Next.js (App Router, shadcn/ui, tRPC API, better-auth)
- `apps/native` — Expo (React Native, expo-router, ten sam tRPC API)
- `packages/db` — schema Drizzle + klient Postgres
- `packages/auth` — konfiguracja better-auth (email/hasło + plugin Expo)
- `packages/api` — routery tRPC (studenci, zajęcia, stawki, zajęcia cykliczne, statystyki, push)

## Start lokalny

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @repo/db db:push
pnpm dev
```

Web wystartuje na `http://localhost:3000`. Aplikacja mobilna (`pnpm --filter native dev`)
łączy się z tym samym API przez `EXPO_PUBLIC_API_URL`.

## Produkcja

`DATABASE_URL` w środowisku produkcyjnym ustaw na connection string z Neon
(`sslmode=require`). Reszta configu (`BETTER_AUTH_URL`, `TRUSTED_ORIGINS`,
`CRON_SECRET`) — jak w `.env.example`.

## Skrypty

- `pnpm dev` / `pnpm build` — uruchamia wszystkie aplikacje przez Turbo
- `pnpm typecheck` — `tsc --noEmit` we wszystkich pakietach
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm --filter @repo/db db:generate|db:push|db:studio` — migracje Drizzle

## Kontrybucje

Pull requesty są mile widziane. Przed otwarciem przeczytaj [CONTRIBUTING.md](CONTRIBUTING.md),
bo każda kontrybucja wymaga zgody na opisane tam warunki licencyjne.

## Licencja

Kod jest udostępniany na licencji [GNU Affero General Public License v3.0](LICENSE).
Jeśli uruchamiasz zmodyfikowaną wersję jako usługę sieciową, musisz udostępnić jej kod
źródłowy użytkownikom tej usługi.

Copyright © 2026 Kamil Marczak

### Znaki towarowe

Licencja obejmuje tylko kod. Nazwa „RozliczKorki”, logo i inne materiały z katalogu
`brand/`, domena `rozliczkorki.pl` oraz identyfikatory aplikacji `pl.rozliczkorki.app`
nie są nią objęte. Jeśli publikujesz własną wersję aplikacji, użyj innej nazwy, logo
i identyfikatorów.

---

# RozliczKorki (English)

A tutoring tracker: lesson calendar, attendance and payment status, earnings, students
with rates that change over time, recurring lessons and push reminders.

## Structure

- `apps/web` — Next.js (App Router, shadcn/ui, tRPC API, better-auth)
- `apps/native` — Expo (React Native, expo-router, the same tRPC API)
- `packages/db` — Drizzle schema + Postgres client
- `packages/auth` — better-auth configuration (email/password + Expo plugin)
- `packages/api` — tRPC routers (students, lessons, rates, recurring lessons, statistics, push)

## Local setup

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @repo/db db:push
pnpm dev
```

The web app starts at `http://localhost:3000`. The mobile app (`pnpm --filter native dev`)
connects to the same API via `EXPO_PUBLIC_API_URL`.

## Production

In production, set `DATABASE_URL` to the Neon connection string (`sslmode=require`).
The rest of the config (`BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, `CRON_SECRET`) follows
`.env.example`.

## Scripts

- `pnpm dev` / `pnpm build` — runs all apps through Turbo
- `pnpm typecheck` — `tsc --noEmit` in all packages
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm --filter @repo/db db:generate|db:push|db:studio` — Drizzle migrations

## Contributing

Pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md#contributing) before
opening one, as every contribution requires agreeing to the license terms described there.

## License

The code is released under the [GNU Affero General Public License v3.0](LICENSE).
If you run a modified version as a network service, you must make its source code
available to the users of that service.

Copyright © 2026 Kamil Marczak

### Trademarks

The license covers the code only. The name “RozliczKorki”, the logo and other assets
in the `brand/` directory, the `rozliczkorki.pl` domain and the `pl.rozliczkorki.app`
app identifiers are not covered by it. If you publish your own version of the app, use
a different name, logo and identifiers.
