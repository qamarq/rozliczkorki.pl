import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "card-collapsed:";

const listeners = new Set<() => void>();
const memory = new Map<string, boolean>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function read(id: string) {
  const cached = memory.get(id);
  if (cached !== undefined) return cached;
  try {
    return localStorage.getItem(PREFIX + id) === "1";
  } catch {
    return false;
  }
}

export function useCollapsed(id: string) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => read(id),
    () => false,
  );

  const setCollapsed = useCallback(
    (value: boolean) => {
      memory.set(id, value);
      try {
        if (value) localStorage.setItem(PREFIX + id, "1");
        else localStorage.removeItem(PREFIX + id);
      } catch {
        // Blocked storage only means the card reopens on the next visit.
      }
      for (const listener of listeners) listener();
    },
    [id],
  );

  return [collapsed, setCollapsed] as const;
}
