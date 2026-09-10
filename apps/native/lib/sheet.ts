import type { ReactNode } from "react";

export type SheetState = { key: number; render: () => ReactNode } | null;

let state: SheetState = null;
let counter = 0;
const listeners = new Set<(s: SheetState) => void>();

function notify() {
  listeners.forEach((l) => l(state));
}

export function openSheet(render: () => ReactNode) {
  counter += 1;
  state = { key: counter, render };
  notify();
}

export function closeSheet() {
  if (!state) return;
  state = null;
  notify();
}

export function subscribeSheet(fn: (s: SheetState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
