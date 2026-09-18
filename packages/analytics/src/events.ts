export type Iso8601 = string;

export type SignupMethod = "email" | "google" | "passkey";

export type Platform = "web" | "ios" | "android";

export type OnboardingStepName =
  | "profile_completed"
  | "education_preferences_set"
  | "payment_preferences_set"
  | "notification_preferences_set";

export type SetupContext = "after_signup" | "from_dashboard";

export type SummaryViewType = "earned" | "due" | "overdue" | "full_summary";

export type AnalyticsEventMap = {
  signup_started: {
    signup_method?: SignupMethod;
    source?: string;
    locale?: string;
    timestamp: Iso8601;
  };
  signup_completed: {
    account_id: string;
    plan_tier: string;
    signup_method: SignupMethod;
    timestamp: Iso8601;
  };
  onboarding_step_completed: {
    step_name: OnboardingStepName;
    step_number?: number;
    time_since_signup_seconds?: number;
    timestamp: Iso8601;
  };
  setup_session_started: {
    setup_context: SetupContext;
    platform: Platform;
    time_since_signup_seconds?: number;
    timestamp: Iso8601;
  };
  first_student_added: {
    student_count_after: number;
    first_student_id: string;
    time_since_setup_seconds?: number;
    timestamp: Iso8601;
  };
  first_lesson_scheduled: {
    lesson_count_after: number;
    lesson_datetime: Iso8601;
    student_id: string;
    time_since_first_student_seconds?: number;
  };
  lesson_check_off_completed: {
    lesson_id: string;
    check_off_status: string;
    time_since_lesson_scheduled_seconds?: number;
    timestamp: Iso8601;
  };
  financial_summary_viewed: {
    summary_view_type: SummaryViewType;
    overdue_lessons_count: number;
    due_lessons_count: number;
    timestamp: Iso8601;
  };
  first_financial_summary_seen: {
    earned_amount_preview: number;
    due_amount_preview: number;
    overdue_amount_preview: number;
    timestamp: Iso8601;
  };
};

export type AnalyticsEvent = keyof AnalyticsEventMap;

export const DEFAULT_PLAN_TIER = "free";

export function nowIso(): Iso8601 {
  return new Date().toISOString();
}

export function secondsBetween(from: Date | number, to: Date | number = Date.now()) {
  const fromMs = from instanceof Date ? from.getTime() : from;
  const toMs = to instanceof Date ? to.getTime() : to;
  return Math.max(0, Math.round((toMs - fromMs) / 1000));
}

/**
 * Mixpanel treats `null`/`""` as real values that pollute a property's type, so
 * empty properties are dropped rather than sent.
 */
export function compactProps<T extends Record<string, unknown>>(props: T) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    out[key] = value;
  }
  return out;
}
