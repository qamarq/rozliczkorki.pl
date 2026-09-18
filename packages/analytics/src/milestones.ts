import { secondsBetween } from "./events";

export interface AnalyticsStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const PREFIX = "rk_analytics.";
const ONCE_INDEX = `${PREFIX}once_index`;

const MILESTONE_KEYS = [
  "signup_completed_at",
  "setup_progress_at",
  "first_student_added_at",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export type OnceKey =
  | "signup_completed"
  | "first_student_added"
  | "first_lesson_scheduled"
  | "first_financial_summary_seen"
  | `onboarding_step.${string}`;

export function createMilestones(storage: AnalyticsStorage) {
  async function markAt(key: MilestoneKey, at: Date = new Date()) {
    try {
      await storage.setItem(PREFIX + key, at.toISOString());
    } catch {
      // Analytics bookkeeping must never break the flow it is measuring.
    }
  }

  async function secondsSince(key: MilestoneKey): Promise<number | undefined> {
    try {
      const raw = await storage.getItem(PREFIX + key);
      if (!raw) return undefined;
      const at = new Date(raw);
      if (Number.isNaN(at.getTime())) return undefined;
      return secondsBetween(at);
    } catch {
      return undefined;
    }
  }

  async function readOnceIndex(): Promise<string[]> {
    try {
      const raw = await storage.getItem(ONCE_INDEX);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
    } catch {
      return [];
    }
  }

  /** Returns true only on the very first call for this key on this device. */
  async function claimOnce(key: OnceKey): Promise<boolean> {
    try {
      const claimed = await readOnceIndex();
      if (claimed.includes(key)) return false;
      await storage.setItem(ONCE_INDEX, JSON.stringify([...claimed, key]));
      return true;
    } catch {
      return false;
    }
  }

  async function hasClaimed(key: OnceKey): Promise<boolean> {
    return (await readOnceIndex()).includes(key);
  }

  async function reset() {
    try {
      await Promise.all([
        ...MILESTONE_KEYS.map((key) => storage.removeItem(PREFIX + key)),
        storage.removeItem(ONCE_INDEX),
      ]);
    } catch {
      // Best effort: a failed clear only risks stale timings, never a crash.
    }
  }

  return {
    markSignupCompleted: (at?: Date) => markAt("signup_completed_at", at),
    /** Bumped by every finished onboarding step, so "setup" means the latest one. */
    markSetupProgress: (at?: Date) => markAt("setup_progress_at", at),
    markFirstStudentAdded: (at?: Date) => markAt("first_student_added_at", at),
    secondsSinceSignup: () => secondsSince("signup_completed_at"),
    secondsSinceSetup: () => secondsSince("setup_progress_at"),
    secondsSinceFirstStudent: () => secondsSince("first_student_added_at"),
    claimOnce,
    hasClaimed,
    reset,
  };
}

export type Milestones = ReturnType<typeof createMilestones>;
