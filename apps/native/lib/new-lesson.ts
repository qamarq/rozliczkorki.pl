import type { Href } from "expo-router";

let href: Href = "/lesson/new";

export function setNewLessonHref(next: Href) {
  href = next;
}

export function getNewLessonHref() {
  return href;
}
