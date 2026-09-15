import { requestLessonSheet } from "@/lib/pending-lesson";
import { notifyEmailVerified } from "@/lib/pending-verification";

const LESSON_LINK = /lesson\/([0-9a-f-]{36})/i;
const VERIFY_LINK = /login-email\?(.*)$/i;

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
  if (!match) return path;
  requestLessonSheet(match[1]);
  return initial ? "/" : null;
}
