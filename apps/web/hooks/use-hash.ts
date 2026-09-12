"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getSnapshot() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

export function useHash() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "");
}

export function pushHash(hash: string) {
  if (getSnapshot() === hash) return;
  window.history.pushState(null, "", `#${hash}`);
  notify();
}

export function replaceHash(hash: string) {
  if (getSnapshot() === hash) return;
  window.history.replaceState(null, "", `#${hash}`);
  notify();
}

export function clearHash() {
  if (!window.location.hash) return;
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
  notify();
}
