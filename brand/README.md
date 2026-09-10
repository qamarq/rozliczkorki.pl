# RozliczKorki brand assets

Source of truth for the logo. Colors: background `#111827`, indigo `#6366F1`,
emerald `#10B981`.

## Files

- `logo.svg` — full mark with rounded-square background (rx 12/48). Use for
  UI (web sidebar/header, favicon source).
- `logo-square.svg` — same mark, full-bleed square background (no rounding).
  Use as the source for app store icons — iOS/Android apply their own mask.
- `logo-glyph.svg` — mark only, no background, transparent. Use on colored
  backgrounds or as an Android adaptive-icon foreground layer.
- `png/` — rendered exports (see below). Regenerate with `node
  generate-png.mjs` (needs `playwright` — `npx playwright install chromium`
  once if you don't have it).

## Rendered PNGs (`png/`)

| File | Size | Background | Use |
|---|---|---|---|
| `icon-square-1024.png` | 1024×1024 | opaque `#111827` | App Store / Play Store icon upload, `apps/native/assets/icon.png` |
| `icon-square-512.png` | 512×512 | opaque `#111827` | Play Console 512×512 icon, general use |
| `icon-glyph-1024.png` | 1024×1024 | transparent | `apps/native/assets/adaptive-icon.png`, `splash.png` |
| `icon-rounded-1024.png` … `icon-rounded-32.png` | 1024/512/256/128/64/32 | transparent (rounded square) | favicons, web `app/icon.png`, in-app logo raster fallback, marketing |

The actual in-app assets (`apps/native/assets/*`, `apps/web/app/icon.png`)
are copies of these — if you change the design, edit the SVGs here,
regenerate, then re-copy into those locations.
