import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Mixpanel } from "mixpanel-react-native";
import {
  type AnalyticsEvent,
  type AnalyticsEventMap,
  type AnalyticsStorage,
  type FlowDeps,
  type Platform as AnalyticsPlatform,
  compactProps,
  createMilestones,
} from "@repo/analytics";

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const API_HOST = process.env.EXPO_PUBLIC_MIXPANEL_API_HOST;
const CONSENT_KEY = "rk_analytics.consent";

const storage: AnalyticsStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const milestones = createMilestones(storage);

export const analyticsPlatform: AnalyticsPlatform =
  Platform.OS === "ios" ? "ios" : "android";

let mixpanel: Mixpanel | null = null;
let consentDenied = false;
let booting: Promise<void> | null = null;

// Screen effects can fire before the root layout's, so events raised during the
// async SDK boot are held here and replayed once it finishes.
const queue: { event: string; props: Record<string, unknown> }[] = [];

function flushQueue() {
  const pending = queue.splice(0, queue.length);
  if (!mixpanel || consentDenied) return;
  for (const item of pending) {
    try {
      mixpanel.track(item.event, item.props);
    } catch {
      // See track().
    }
  }
}

export function initAnalytics() {
  if (!TOKEN) return Promise.resolve();
  booting ??= (async () => {
    try {
      consentDenied = (await AsyncStorage.getItem(CONSENT_KEY)) === "denied";
      if (consentDenied) return;
      // Server-side people updates are unused, so trackAutomaticEvents stays off.
      const instance = new Mixpanel(TOKEN, false);
      if (API_HOST) instance.setServerURL(API_HOST);
      await instance.init();
      mixpanel = instance;
    } catch {
      // A failed analytics boot must never block the app from starting.
    } finally {
      flushQueue();
    }
  })();
  return booting;
}

export async function setAnalyticsConsent(granted: boolean) {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    return;
  }
  consentDenied = !granted;
  if (granted) {
    if (!mixpanel) booting = null;
    await initAnalytics();
  } else {
    queue.length = 0;
    mixpanel?.optOutTracking();
  }
}

export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEventMap[E]) {
  if (!TOKEN || consentDenied) return;
  const payload = compactProps(props);
  if (!mixpanel) {
    queue.push({ event, props: payload });
    void initAnalytics();
    return;
  }
  try {
    mixpanel.track(event, payload);
  } catch {
    // Offline devices and transport errors must not take a user flow down.
  }
}

export const flowDeps: FlowDeps = { track, milestones };

export function identifyUser(user: { id: string; name?: string | null }) {
  if (!mixpanel) return;
  try {
    void mixpanel.identify(user.id);
    if (user.name) mixpanel.getPeople().set("$name", user.name);
  } catch {
    // See track().
  }
}

export function deviceLocale() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale ? locale.replace("-", "_") : undefined;
  } catch {
    return undefined;
  }
}

export function resetAnalytics() {
  void milestones.reset();
  try {
    mixpanel?.reset();
  } catch {
    // See track().
  }
}
