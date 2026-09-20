import { requestLessonSheet } from "@/lib/pending-lesson";
import { notifyEmailVerified } from "@/lib/pending-verification";

const LESSON_LINK = /lesson\/([0-9a-f-]{36})/i;
const VERIFY_LINK = /login-email\?(.*)$/i;
const DASHBOARD_LINK = /\/dashboard(\/[^?#]*)?/i;
const SCHOOL_LINK = /^schools\/([0-9a-f-]{36})$/i;

const DASHBOARD_ROUTES: Record<string, string> = {
  "": "/",
  students: "/students",
  schools: "/schools",
  vacations: "/vacations",
  stats: "/stats",
  settings: "/settings",
};

function dashboardPath(path: string) {
  const match = DASHBOARD_LINK.exec(path);
  if (!match) return null;

  const rest = (match[1] ?? "").replace(/^\/+|\/+$/g, "");
  const school = SCHOOL_LINK.exec(rest);
  if (school) return `/school/${school[1]}`;

  return DASHBOARD_ROUTES[rest] ?? "/";
}

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  const verify = VERIFY_LINK.exec(path);
  if (verify) {
    const params = new URLSearchParams(verify[1]);
    const error = params.get("error");
    if (error) return `/login-email?error=${encodeURIComponent(error)}`;
    if (params.get("verified") && !initial && notifyEmailVerified()) return null;
    return "/login-email?verified=1";
  }

  const match = LESSON_LINK.exec(path);
  if (match) {
    requestLessonSheet(match[1]);
    return initial ? "/" : null;
  }

  return dashboardPath(path) ?? path;
}
