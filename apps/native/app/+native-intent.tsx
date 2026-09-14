import { requestLessonSheet } from "@/lib/pending-lesson";

const LESSON_LINK = /lesson\/([0-9a-f-]{36})/i;

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  const match = LESSON_LINK.exec(path);
  if (!match) return path;
  requestLessonSheet(match[1]);
  return initial ? "/" : null;
}
