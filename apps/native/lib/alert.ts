export type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type AlertState = { title: string; message?: string; buttons: AlertButton[] } | null;

let state: AlertState = null;
const listeners = new Set<(s: AlertState) => void>();

function notify() {
  listeners.forEach((l) => l(state));
}

export function alert(title: string, message?: string, buttons?: AlertButton[]) {
  state ={ title, message, buttons: buttons?.length ? buttons : [{ text: "OK" }] };
  notify();
}

export function dismissAlert() {
  state = null;
  notify();
}

export function subscribeAlert(fn: (s: AlertState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
