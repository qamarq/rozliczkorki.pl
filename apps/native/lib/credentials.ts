import { Platform } from "react-native";
import {
  signIn,
  signUpWithPassword,
  type SignInOption,
} from "react-native-credentials-manager";
import { authClient } from "@/lib/auth-client";
import { randomNonce } from "@/lib/google-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const credentialManagerAvailable = Platform.OS === "android";

export type SavedCredentialResult =
  | { status: "signed-in" }
  | { status: "dismissed" }
  | { status: "unavailable" }
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

export async function signInWithSavedCredential(): Promise<SavedCredentialResult> {
  if (!credentialManagerAvailable) return { status: "unavailable" };

  const passkeys = await passkeyRequest().catch(() => undefined);
  const nonce = randomNonce();
  const options: SignInOption[] = ["password"];
  if (passkeys) options.unshift("passkeys");
  if (webClientId) options.push("google-signin");

  let credential;
  try {
    credential = await signIn(options, {
      passkeys,
      googleSignIn: webClientId
        ? { serverClientId: webClientId, nonce, autoSelectEnabled: false }
        : undefined,
    });
  } catch (e) {
    return isUserCancelled(e) ? { status: "dismissed" } : { status: "unavailable" };
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
    case "passkey":
      ({ error } = await authClient.$fetch("/passkey/verify-authentication", {
        method: "POST",
        body: { response: JSON.parse(credential.authenticationResponseJson) },
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
  if (!credentialManagerAvailable || !email || !password) return;
  try {
    await signUpWithPassword({ username: email, password });
  } catch (e) {
    if (!isUserCancelled(e)) console.warn("Saving password credential failed", e);
  }
}
