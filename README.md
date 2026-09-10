# RozliczKorki

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
