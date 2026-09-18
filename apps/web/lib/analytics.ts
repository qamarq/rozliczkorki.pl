"use client";

import mixpanel from "mixpanel-browser";
import {
  type AnalyticsEvent,
  type AnalyticsEventMap,
  type AnalyticsStorage,
  type FlowDeps,
  compactProps,
  createMilestones,
} from "@repo/analytics";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const API_HOST = process.env.NEXT_PUBLIC_MIXPANEL_API_HOST;
const CONSENT_KEY = "rk_analytics.consent";

const isBrowser = () => typeof window !== "undefined";

function readLocal(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

const storage: AnalyticsStorage = {
  async getItem(key) {
    return isBrowser() ? readLocal(key) : null;
  },
  async setItem(key, value) {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Private mode / quota: timings degrade, nothing breaks.
    }
  },
  async removeItem(key) {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignored for the same reason as setItem.
    }
  },
};

export const milestones = createMilestones(storage);

export function hasAnalyticsConsent() {
  return isBrowser() && readLocal(CONSENT_KEY) !== "denied";
}

export function setAnalyticsConsent(granted: boolean) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    return;
  }
  if (granted) initAnalytics();
  else if (started) mixpanel.opt_out_tracking();
}

let started = false;

export function initAnalytics() {
  if (started || !isBrowser() || !TOKEN || !hasAnalyticsConsent()) return;
  started = true;
  mixpanel.init(TOKEN, {
    ...(API_HOST ? { api_host: API_HOST } : {}),
    autocapture: false,
    track_pageview: false,
    persistence: "localStorage",
    ignore_dnt: false,
  });
}

export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEventMap[E]) {
  // Child effects run before the provider's, so the first event may arrive first.
  initAnalytics();
  if (!started || !hasAnalyticsConsent()) return;
  try {
    mixpanel.track(event, compactProps(props));
  } catch {
    // Ad blockers and offline tabs must not take a user flow down with them.
  }
}

export const flowDeps: FlowDeps = { track, milestones };

export function identifyUser(user: { id: string; name?: string | null }) {
  if (!started) return;
  try {
    mixpanel.identify(user.id);
    mixpanel.people.set(compactProps({ $name: user.name ?? undefined }));
  } catch {
    // See track().
  }
}

/** Landing identifier: explicit campaign param, else referring host, else "direct". */
export function acquisitionSource() {
  if (!isBrowser()) return undefined;
  const params = new URLSearchParams(window.location.search);
  const tagged = params.get("utm_source") ?? params.get("src");
  if (tagged) return tagged;
  if (!document.referrer) return "direct";
  try {
    const referrer = new URL(document.referrer);
    return referrer.host === window.location.host ? "internal" : referrer.host;
  } catch {
    return "direct";
  }
}

export function browserLocale() {
  if (!isBrowser()) return undefined;
  const language = navigator.language;
  return language ? language.replace("-", "_") : undefined;
}

export function resetAnalytics() {
  void milestones.reset();
  if (!started) return;
  try {
    mixpanel.reset();
  } catch {
    // See track().
  }
}
