let pendingLessonId: string | null = null;
const listeners = new Set<() => void>();

export function requestLessonSheet(lessonId: string) {
  pendingLessonId = lessonId;
  listeners.forEach((l) => l());
}

export function takePendingLesson() {
  const lessonId = pendingLessonId;
  pendingLessonId = null;
  return lessonId;
}

export function subscribePendingLesson(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
