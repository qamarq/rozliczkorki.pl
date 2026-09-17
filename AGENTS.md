# Agent instructions

## Project docs

- Mobile app (`apps/native`): read [apps/native/README.md](apps/native/README.md) before
  building, installing on a device or releasing (APK/AAB scripts, signing, `.env` gotcha).
- Web app (`apps/web`): see [apps/web/AGENTS.md](apps/web/AGENTS.md).

## Code comments

Do not write comments that only restate what the code already says. Add one only when
there is a non-obvious reason, constraint or workaround that the code cannot express by
itself, and then keep it to a single line.

## Language

UI copy is Polish. Everything else is English: code comments, commit messages, branch
names, PR titles and descriptions.

## Commit messages

One subject line, nothing else. No body, no bullet list, no explanation paragraph.

```
feat: add school payout tracking
```

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
