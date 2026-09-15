export const VERIFIED_CALLBACK = "/login-email?verified=1";

type PendingSignUp = { email: string; password: string };

let pendingSignUp: PendingSignUp | null = null;
const listeners = new Set<(signUp: PendingSignUp) => void>();

export function setPendingSignUp(signUp: PendingSignUp | null) {
  pendingSignUp = signUp;
}

export function notifyEmailVerified() {
  const signUp = pendingSignUp;
  if (!signUp || listeners.size === 0) return false;
  listeners.forEach((l) => l(signUp));
  return true;
}

export function subscribeEmailVerified(fn: (signUp: PendingSignUp) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
