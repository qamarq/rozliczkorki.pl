import { useEffect, useRef } from "react";
import {
  DEFAULT_PLAN_TIER,
  nowIso,
  type SignupMethod,
  secondsBetween,
  trackOnboardingStep,
  trackSetupSessionStarted,
} from "@repo/analytics";
import {
  analyticsPlatform,
  flowDeps,
  identifyUser,
  initAnalytics,
  milestones,
  track,
} from "@/lib/analytics";
import { useSession } from "@/lib/auth-client";

/** A session whose account was created this recently is treated as a fresh signup. */
const FRESH_SIGNUP_WINDOW_SECONDS = 15 * 60;

let pendingSignupMethod: SignupMethod = "email";

export function rememberSignupMethod(method: SignupMethod) {
  pendingSignupMethod = method;
}

export function AnalyticsIdentity() {
  const { data: session } = useSession();
  const identified = useRef<string | null>(null);
  const setupReported = useRef(false);

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user || identified.current === user.id) return;
    identified.current = user.id;

    void (async () => {
      await initAnalytics();
      identifyUser(user);

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
          signup_method: pendingSignupMethod,
          timestamp: nowIso(),
        });
      }

      // The account name is collected during signup, so a session implies a profile.
      await trackOnboardingStep(flowDeps, "profile_completed");

      // Setup is only "in progress" until the user reaches the activation moment.
      const activated = await milestones.hasClaimed("first_lesson_scheduled");
      if (!activated && !setupReported.current) {
        setupReported.current = true;
        await trackSetupSessionStarted(
          flowDeps,
          isFreshSignup ? "after_signup" : "from_dashboard",
          analyticsPlatform,
        );
      }
    })();
  }, [session?.user]);

  return null;
}
