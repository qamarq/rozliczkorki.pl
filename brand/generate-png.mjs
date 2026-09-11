// Regenerates brand/png/* from the SVG sources in this folder.
// Usage: cd brand && node generate-png.mjs
// Requires `playwright` (chromium) available — run `npx playwright install chromium`
// once if you don't already have it, or `pnpm add -D playwright` in a scratch dir.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "png");

const VARIANTS = [
  {
    file: "logo.svg",
    name: "icon-rounded",
    sizes: [1024, 512, 256, 128, 64, 32],
    transparent: true,
  },
  {
    file: "logo-square.svg",
    name: "icon-square",
    sizes: [1024, 512],
    transparent: false,
  },
  { file: "logo-glyph.svg", name: "icon-glyph", sizes: [1024], transparent: true },
];

async function render(svg, size, outPath, transparent) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const sized = svg.replace("<svg ", `<svg width="${size}" height="${size}" `);
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;}</style></head><body>${sized}</body></html>`,
  );
  const el = await page.$("svg");
  await el.screenshot({ path: outPath, omitBackground: transparent });
  await browser.close();
}

for (const variant of VARIANTS) {
  const svg = readFileSync(join(__dirname, variant.file), "utf8");
  for (const size of variant.sizes) {
    const outPath = join(outDir, `${variant.name}-${size}.png`);
    await render(svg, size, outPath, variant.transparent);
    console.log("wrote", outPath);
  }
}
