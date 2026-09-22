import { Platform } from "react-native";
import {
  signIn,
  signUpWithPassword,
  type SignInOption,
} from "react-native-credentials-manager";
import { authClient } from "@/lib/auth-client";
import { randomNonce } from "@/lib/google-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const credentialManagerAvailable =
  Platform.OS === "android" || Platform.OS === "ios";

function base64UrlToBase64(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return base64 + "=".repeat((4 - (base64.length % 4)) % 4);
}

function base64ToBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The iOS native module uses plain base64 while WebAuthn servers expect base64url.
function passkeyResponseForServer(json: string) {
  const response = JSON.parse(json);
  if (Platform.OS !== "ios") return response;
  const inner = response.response ?? {};
  return {
    ...response,
    id: base64ToBase64Url(response.id),
    rawId: base64ToBase64Url(response.rawId),
    response: {
      ...inner,
      authenticatorData: base64ToBase64Url(inner.authenticatorData ?? ""),
      clientDataJSON: base64ToBase64Url(inner.clientDataJSON ?? ""),
      signature: base64ToBase64Url(inner.signature ?? ""),
      ...(inner.userHandle ? { userHandle: base64ToBase64Url(inner.userHandle) } : {}),
    },
  };
}

export type SavedCredentialResult =
  | { status: "signed-in" }
  | { status: "dismissed" }
  | { status: "unavailable"; detail?: string }
  | { status: "error"; message: string };

function isUserCancelled(e: unknown) {
  const code = (e as { code?: string } | null)?.code ?? "";
  const message = e instanceof Error ? e.message : "";
  return /cancel/i.test(code) || /cancel/i.test(message);
}

async function passkeyRequest() {
  const { data } = await authClient.$fetch<Record<string, unknown>>(
    "/passkey/generate-authenticate-options",
    { method: "GET" },
  );
  return data ?? undefined;
}

let pendingSignIn: Promise<SavedCredentialResult> | null = null;

export function signInWithSavedCredential(): Promise<SavedCredentialResult> {
  pendingSignIn ??= requestSavedCredential().finally(() => {
    pendingSignIn = null;
  });
  return pendingSignIn;
}

async function requestSavedCredential(): Promise<SavedCredentialResult> {
  if (!credentialManagerAvailable) return { status: "unavailable" };

  const passkeys = await passkeyRequest().catch(() => undefined);
  if (passkeys && Platform.OS === "ios" && typeof passkeys.challenge === "string") {
    passkeys.challenge = base64UrlToBase64(passkeys.challenge);
  }
  const nonce = randomNonce();
  const options: SignInOption[] = ["password"];
  if (passkeys) options.unshift("passkeys");
  if (Platform.OS === "ios") options.push("apple-signin");
  else if (webClientId) options.push("google-signin");

  let credential;
  try {
    credential = await signIn(options, {
      passkeys,
      googleSignIn:
        Platform.OS === "android" && webClientId
          ? { serverClientId: webClientId, nonce, autoSelectEnabled: false }
          : undefined,
    });
  } catch (e) {
    if (isUserCancelled(e)) return { status: "dismissed" };
    const code = (e as { code?: string } | null)?.code;
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Credential sign-in failed", options, e);
    return { status: "unavailable", detail: code ? `${code}: ${message}` : message };
  }

  let error: { message?: string } | null = null;
  switch (credential.type) {
    case "password":
      ({ error } = await authClient.signIn.email({
        email: credential.username,
        password: credential.password,
      }));
      break;
    case "google-signin":
      ({ error } = await authClient.signIn.social({
        provider: "google",
        idToken: { token: credential.idToken, nonce },
      }));
      break;
    case "apple-signin":
      ({ error } = await authClient.signIn.social({
        provider: "apple",
        idToken: { token: credential.idToken },
      }));
      break;
    case "passkey":
      ({ error } = await authClient.$fetch("/passkey/verify-authentication", {
        method: "POST",
        body: {
          response: passkeyResponseForServer(credential.authenticationResponseJson),
        },
      }));
      break;
    default:
      return { status: "unavailable" };
  }

  return error
    ? { status: "error", message: error.message ?? "Spróbuj ponownie" }
    : { status: "signed-in" };
}

export async function savePasswordCredential(email: string, password: string) {
  // iOS offers to save the password itself via AutoFill on the login form.
  if (Platform.OS !== "android" || !email || !password) return;
  try {
    await signUpWithPassword({ username: email, password });
  } catch (e) {
    if (!isUserCancelled(e)) console.warn("Saving password credential failed", e);
  }
}
