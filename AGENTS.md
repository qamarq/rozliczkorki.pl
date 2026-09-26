# Agent instructions

## Project docs

- Mobile app (`apps/native`): read [apps/native/README.md](apps/native/README.md) before
  building, installing on a device or releasing (APK/AAB scripts, signing, `.env` gotcha).
- Web app (`apps/web`): see [apps/web/AGENTS.md](apps/web/AGENTS.md). Read
  [apps/web/DESIGN.md](apps/web/DESIGN.md) before adding or restyling any web UI.

## Code comments

Do not write comments that only restate what the code already says. Add one only when
there is a non-obvious reason, constraint or workaround that the code cannot express by
itself, and then keep it to a single line.

## Mobile app gotchas

The Expo app persists its whole React Query cache to AsyncStorage for 30 days
(`apps/native/lib/trpc.tsx`). On launch that snapshot is restored and rendered _before_
any refetch lands, so the first paint can use data older than the bundle.

Never assume a field you add to a tRPC response exists on a row the native app renders.
Give it a fallback, the way `toneOf()` in `apps/native/components/calendar/shared.tsx`
does — a missing field must not be able to crash a screen.

The cache is dropped when `buster` changes, which is the Android `versionCode`. That is
set by CI to `100 + GITHUB_RUN_NUMBER` on every release build
(`.github/workflows/android-release.yml`), so the value sitting in `app.json` is stale
and must not be bumped by hand. Only `expo.version` is edited manually. Local builds keep
the stale code and therefore reuse the cache, which is why the fallback matters more than
the busting.

## Running things

Do not start dev servers or other long-running processes on your own initiative — assume
one is already running, and ask before starting another.

## Language

UI copy is Polish. Everything else is English: code comments, commit messages, branch
names, PR titles and descriptions.

## Commit messages

One subject line, nothing else. No body, no bullet list, no explanation paragraph.

Use Conventional Commits with a scope naming the part of the repo the change touches:

```
feat(web): add school payout tracking
fix(native): survive cached lessons without a tone
ci(android): cache gradle builds
```

Scopes follow the workspace layout: `web`, `native`, `api`, `db`, `shared`, plus
`android`, `ios` and `cd` for platform and release plumbing, and `auth` for sign-in.
Drop the scope only when a change genuinely spans the whole repo.

## Before every push

Run the same checks as CI (`.github/workflows/ci.yml`) from the repo root and make sure
all of them pass:

```bash
pnpm format:fix
pnpm lint:typecheck
pnpm lint:check
pnpm format:check
```

Never push unformatted code.

## Pull requests

After pushing a PR, wait for CI and check the result:

```bash
gh pr checks <number> --watch
```

Only report the PR as ready once all checks are green. If a check fails, read the log
(`gh run view <run-id> --log-failed`), fix it, push again and re-check.
