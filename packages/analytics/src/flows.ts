import {
  type AnalyticsEvent,
  type AnalyticsEventMap,
  type Iso8601,
  type OnboardingStepName,
  type Platform,
  type SetupContext,
  type SummaryViewType,
  nowIso,
  secondsBetween,
} from "./events";
import type { Milestones } from "./milestones";

export type TrackFn = <E extends AnalyticsEvent>(
  event: E,
  props: AnalyticsEventMap[E],
) => void;

export type FlowDeps = {
  track: TrackFn;
  milestones: Milestones;
};

const STEP_NUMBERS: Record<OnboardingStepName, number> = {
  profile_completed: 1,
  education_preferences_set: 2,
  payment_preferences_set: 3,
  notification_preferences_set: 4,
};

/** Each onboarding step counts once; re-editing a preference is not a new step. */
export async function trackOnboardingStep(
  { track, milestones }: FlowDeps,
  stepName: OnboardingStepName,
) {
  if (!(await milestones.claimOnce(`onboarding_step.${stepName}`))) return;
  await milestones.markSetupProgress();
  track("onboarding_step_completed", {
    step_name: stepName,
    step_number: STEP_NUMBERS[stepName],
    time_since_signup_seconds: await milestones.secondsSinceSignup(),
    timestamp: nowIso(),
  });
}

export async function trackSetupSessionStarted(
  { track, milestones }: FlowDeps,
  setupContext: SetupContext,
  platform: Platform,
) {
  track("setup_session_started", {
    setup_context: setupContext,
    platform,
    time_since_signup_seconds: await milestones.secondsSinceSignup(),
    timestamp: nowIso(),
  });
}

export async function trackStudentAdded(
  deps: FlowDeps,
  { studentId, countAfter }: { studentId: string; countAfter: number },
) {
  const { track, milestones } = deps;
  // The rate set on the first student is this product's payment configuration.
  await trackOnboardingStep(deps, "payment_preferences_set");
  if (countAfter > 1) return;
  if (!(await milestones.claimOnce("first_student_added"))) return;
  const timeSinceSetup = await milestones.secondsSinceSetup();
  await milestones.markFirstStudentAdded();
  track("first_student_added", {
    student_count_after: countAfter,
    first_student_id: studentId,
    time_since_setup_seconds: timeSinceSetup,
    timestamp: nowIso(),
  });
}

export async function trackLessonScheduled(
  { track, milestones }: FlowDeps,
  {
    studentId,
    lessonDatetime,
    countAfter,
  }: { studentId: string; lessonDatetime: Iso8601; countAfter: number },
) {
  if (countAfter > 1) return;
  if (!(await milestones.claimOnce("first_lesson_scheduled"))) return;
  track("first_lesson_scheduled", {
    lesson_count_after: countAfter,
    lesson_datetime: lessonDatetime,
    student_id: studentId,
    time_since_first_student_seconds: await milestones.secondsSinceFirstStudent(),
  });
}

export function trackLessonCheckedOff(
  { track }: FlowDeps,
  {
    lessonId,
    status,
    scheduledAt,
  }: { lessonId: string; status: string; scheduledAt?: Date | string | null },
) {
  const createdAt = scheduledAt ? new Date(scheduledAt) : null;
  const valid = createdAt && !Number.isNaN(createdAt.getTime());
  track("lesson_check_off_completed", {
    lesson_id: lessonId,
    check_off_status: status,
    time_since_lesson_scheduled_seconds: valid ? secondsBetween(createdAt) : undefined,
    timestamp: nowIso(),
  });
}

export type FinancialSummarySnapshot = {
  viewType: SummaryViewType;
  overdueLessonsCount: number;
  dueLessonsCount: number;
  earnedAmount: number;
  dueAmount: number;
  overdueAmount: number;
};

export async function trackFinancialSummaryViewed(
  { track, milestones }: FlowDeps,
  snapshot: FinancialSummarySnapshot,
) {
  track("financial_summary_viewed", {
    summary_view_type: snapshot.viewType,
    overdue_lessons_count: snapshot.overdueLessonsCount,
    due_lessons_count: snapshot.dueLessonsCount,
    timestamp: nowIso(),
  });

  if (!(await milestones.claimOnce("first_financial_summary_seen"))) return;
  track("first_financial_summary_seen", {
    earned_amount_preview: snapshot.earnedAmount,
    due_amount_preview: snapshot.dueAmount,
    overdue_amount_preview: snapshot.overdueAmount,
    timestamp: nowIso(),
  });
}
