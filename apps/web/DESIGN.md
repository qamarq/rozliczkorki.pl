# RozliczKorki web design

How the web app (marketing pages, auth and dashboard) should look and feel. Read this
before adding or restyling UI in `apps/web`.

## Direction

RozliczKorki replaces the paper notebook a tutor keeps for lessons and payments. The UI
should feel like a calm, precise tool for tutors (students and teachers), not a developer
tool. The one playful motif is the notebook itself (squared paper, red margin, blue ink),
and it only appears where we contrast "before" with the app: the homepage hero and the
auth side panel.

Everything else is quiet: clear hierarchy, real numbers, consistent status colours.

## Themes

- Dark is the default (`defaultTheme="dark"` in `app/layout.tsx`). Light is fully
  supported and must keep working.
- All colours come from tokens in `app/globals.css`: light values on `:root`, dark
  overrides on `.dark`. Use the Tailwind colour utilities (`bg-card`, `text-success`,
  `bg-paid-soft`...). Never hard-code a colour in a component.
- The only literal colours allowed are objects that look the same in both themes: the
  iOS Live Activity mock, brand logos and store icons.

## Colour roles

| Token                                        | Meaning                                                        |
| -------------------------------------------- | -------------------------------------------------------------- |
| `primary`                                    | Brand indigo. Primary buttons, active state, focus rings.      |
| `success` / `paid-soft`                      | Paid, earned, completed. "Opłacone", "Zarobione".              |
| `warning` / `owed-soft`                      | Waiting for money. "Do zapłaty", "Oczekuje".                   |
| `destructive`                                | Overdue payments, deleting, errors.                            |
| `chart-5`                                    | School payouts and vacations.                                  |
| `muted-foreground`, `faint`                  | Planned amounts, secondary text, cancelled lessons.            |
| `accent` / `accent-foreground`               | Subtle indigo highlight: text links, "Nowość" chip, hover.     |
| `inverse` / `inverse-foreground` / `-border` | High-contrast slabs: final CTA, stats hero card, store badges. |
| `paper`, `kratka`, `margin`, `pen`           | Notebook motif only. Never use them for regular UI.            |

The same money states must use the same colours everywhere: calendar chips, month
summary, stats, pills in dialogs and the marketing mock-ups.

## Typography

- **Poltawski Nowy** (`font-display`), a modern revival of the Polish Antykwa
  Półtawskiego: page titles, dialog titles, marketing headings. Weight 600, slightly
  negative tracking. Never for body text, buttons, labels or numbers.
- **Instrument Sans** (the default body font): everything else.
- **Caveat** (`font-hand`): handwriting inside the notebook, and at most a single
  hand-written line in an empty state.
- No monospace in the UI. Money and dates use `tabular-nums`.
- Small section labels: `text-xs font-semibold uppercase tracking-[0.08em]
text-muted-foreground`.
- Dashboard page titles: 1.9 to 2.3 rem (`PageHeader`). Marketing: h1 up to 4.4 rem, h2
  2 to 3 rem (`SectionHeading`).

## Shape and surfaces

- Cards and panels: `rounded-2xl`, `ring-1 ring-foreground/10`, soft shadow (the base
  `Card` already does this).
- Form controls and buttons in forms: height 40 px (`h-10`), `rounded-[10px]`.
- Pills and badges: `rounded-full`, soft background and strong text in the same role
  colour (for example `bg-paid-soft text-success`).
- Lists: rows split with `divide-y`, each with a 36 px icon tile on `bg-secondary`.
  Don't give every row its own border.
- No blurred colour blobs, dot grids, glows or gradient backgrounds. Flat surfaces only.

## Building blocks

| Where                  | Component                                                   |
| ---------------------- | ----------------------------------------------------------- |
| Marketing page shell   | `components/marketing/site-shell.tsx`                       |
| Marketing section head | `components/marketing/section-heading.tsx`                  |
| Legal pages            | `components/marketing/legal.tsx`                            |
| Notebook motif         | `components/marketing/notebook.tsx`, `notebook-compare.tsx` |
| Auth pages             | `app/(auth)/layout.tsx`, `components/auth-ui.tsx`           |
| Dashboard page title   | `app/(app)/dashboard/page-header.tsx`                       |
| Dashboard dialogs      | `app/(app)/dashboard/form-ui.tsx`                           |
| Settings dialog        | `components/settings-dialog.tsx`                            |

Dashboard dialogs use `FormDialogContent`: a display-font title with a one-line
description, a scrolling body of `FormCard` sections, and a footer with the destructive
action on the left and "Anuluj" plus the primary action on the right. Small enums
(status, lesson mode, payment method) use `Segmented` instead of a select.

A money summary is a small label with a coloured dot, a large bold tabular number, and a
proportion bar underneath (see the month summary in `calendar-view.tsx`).

## Motion

- First paint: `mk-rise` with a `--i` stagger.
- On scroll: wrap the section in `<Reveal>` and mark its children with `mk-reveal`.
- Handwriting: `mk-write`; the circled note uses `mk-stamp`.
- Page changes: every marketing and auth page is wrapped in `<PageTransition>`, and the
  header is pinned with `viewTransitionName: "site-header"`.
- Every animation must stop under `prefers-reduced-motion`, and content must stay
  visible without JavaScript (see the `noscript` fallback in `SiteShell`).
- One orchestrated moment per screen is enough. Don't animate everything.

## Copy

- UI copy is Polish, plain and concrete. Use the tutor's own words: lekcja, uczeń,
  szkółka, stawka, zaległość, rozliczenie.
- Only describe features that exist. Check the native app and the API before promising
  something on the website.
- Example numbers must add up across the page (for example 180 + 120 + 180 = 480 zł
  owed).
- Prefer gender-neutral forms: "sam(a)", "zalogowany(-a)".
