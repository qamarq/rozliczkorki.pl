export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rozliczkorki.pl"
).replace(/\/$/, "");

export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=pl.rozliczkorki.app";

export const APP_STORE_ID = "6812730431";

export const APP_STORE_URL = `https://apps.apple.com/us/app/rozliczkorki-pl/id${APP_STORE_ID}`;

export const GITHUB_URL = "https://github.com/qamarq/rozliczkorki.pl";

export const ANDROID_PACKAGE = "pl.rozliczkorki.app";
