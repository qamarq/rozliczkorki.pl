"use client";

import { authClient, googleClientId } from "@/lib/auth-client";

const GOOGLE_FEDCM_CONFIG = "https://accounts.google.com/gsi/fedcm.json";

type Options = {
  context: "signin" | "signup";
  callbackURL: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

function redirectFlow(callbackURL: string) {
  return authClient.signIn.social({ provider: "google", callbackURL });
}

function readIdToken(token: string | undefined) {
  if (!token) return undefined;
  try {
    const parsed: unknown = JSON.parse(token);
    if (parsed && typeof parsed === "object" && "id_token" in parsed) {
      const idToken = (parsed as { id_token?: unknown }).id_token;
      return typeof idToken === "string" ? idToken : undefined;
    }
  } catch {
    return token;
  }
  return token;
}

function fedCmSupported() {
  return typeof window !== "undefined" && "IdentityCredential" in window;
}

export async function signInWithGoogle({
  context,
  callbackURL,
  onSuccess,
  onError,
}: Options) {
  if (!googleClientId || !fedCmSupported()) {
    await redirectFlow(callbackURL);
    return;
  }

  const openedAt = Date.now();
  let token: string | undefined;

  try {
    const credential = (await navigator.credentials.get({
      mediation: "required",
      identity: {
        context,
        mode: "active",
        providers: [
          {
            configURL: GOOGLE_FEDCM_CONFIG,
            clientId: googleClientId,
            fields: ["name", "email", "picture"],
            params: {
              response_type: "id_token",
              scope: "email profile openid",
              nonce: "not_provided",
              ss_domain: window.location.origin,
            },
          },
        ],
      },
    } as unknown as CredentialRequestOptions)) as
      (Credential & { token?: string }) | null;
    token = readIdToken(credential?.token);
  } catch (error) {
    const dismissedByUser =
      error instanceof DOMException &&
      error.name === "NotAllowedError" &&
      Date.now() - openedAt > 500;
    if (!dismissedByUser) await redirectFlow(callbackURL);
    return;
  }

  if (!token) {
    await redirectFlow(callbackURL);
    return;
  }

  const { error } = await authClient.$fetch("/one-tap/callback", {
    method: "POST",
    body: { idToken: token },
  });

  if (error) {
    onError(error.message ?? "Nie udało się zalogować przez Google");
    return;
  }

  onSuccess();
}
