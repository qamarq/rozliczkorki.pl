# RozliczKorki

[🇵🇱 Polski](README.md) · 🇬🇧 English

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

Pull requests are welcome. Please read [CONTRIBUTING.en.md](CONTRIBUTING.en.md) before
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
