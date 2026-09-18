"use client";

import { useEffect, useRef } from "react";
import {
  DEFAULT_PLAN_TIER,
  nowIso,
  type SignupMethod,
  secondsBetween,
  trackOnboardingStep,
  trackSetupSessionStarted,
} from "@repo/analytics";
import { useSession } from "@/lib/auth-client";
import {
  flowDeps,
  identifyUser,
  initAnalytics,
  milestones,
  track,
} from "@/lib/analytics";

/** A session whose account was created this recently is treated as a fresh signup. */
const FRESH_SIGNUP_WINDOW_SECONDS = 15 * 60;

const SIGNUP_METHOD_KEY = "rk_analytics.signup_method";

export function rememberSignupMethod(method: SignupMethod) {
  try {
    window.sessionStorage.setItem(SIGNUP_METHOD_KEY, method);
  } catch {
    // Non-fatal: signup_completed falls back to "email".
  }
}

function takeSignupMethod(): SignupMethod {
  try {
    const stored = window.sessionStorage.getItem(SIGNUP_METHOD_KEY);
    window.sessionStorage.removeItem(SIGNUP_METHOD_KEY);
    if (stored === "email" || stored === "google" || stored === "passkey") return stored;
  } catch {
    // Fall through to the default below.
  }
  return "email";
}

const SETUP_SESSION_KEY = "rk_analytics.setup_session";

function claimTabSession() {
  try {
    if (window.sessionStorage.getItem(SETUP_SESSION_KEY) === "true") return false;
    window.sessionStorage.setItem(SETUP_SESSION_KEY, "true");
    return true;
  } catch {
    return false;
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const identified = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user || identified.current === user.id) return;
    identified.current = user.id;
    initAnalytics();
    identifyUser(user);

    void (async () => {
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      const isFreshSignup =
        !!createdAt &&
        !Number.isNaN(createdAt.getTime()) &&
        secondsBetween(createdAt) <= FRESH_SIGNUP_WINDOW_SECONDS;

      if (isFreshSignup && (await milestones.claimOnce("signup_completed"))) {
        await milestones.markSignupCompleted(createdAt);
        track("signup_completed", {
          account_id: user.id,
          plan_tier: DEFAULT_PLAN_TIER,
          signup_method: takeSignupMethod(),
          timestamp: nowIso(),
        });
      }

      // The account name is collected during signup, so a session implies a profile.
      await trackOnboardingStep(flowDeps, "profile_completed");

      // Setup is only "in progress" until the user reaches the activation moment.
      const activated = await milestones.hasClaimed("first_lesson_scheduled");
      if (!activated && claimTabSession()) {
        await trackSetupSessionStarted(
          flowDeps,
          isFreshSignup ? "after_signup" : "from_dashboard",
          "web",
        );
      }
    })();
  }, [session?.user]);

  return <>{children}</>;
}
