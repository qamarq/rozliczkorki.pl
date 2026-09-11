import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { GoogleOneTapSignIn } from "react-native-google-one-tap-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

function isUserCancelled(e: unknown) {
  const code = (e as { code?: string } | null)?.code ?? "";
  const message = e instanceof Error ? e.message : "";
  return /cancel/i.test(code) || /cancel/i.test(message);
}

function randomNonce() {
  return Array.from(Crypto.getRandomBytes(24))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getGoogleIdToken() {
  if (Platform.OS !== "android") {
    throw new Error("Google sign-in is only implemented on Android right now");
  }
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured");
  }
  // The nonce is not only replay protection: passing one makes the native module
  // drop setFilterByAuthorizedAccounts, which otherwise hides every account that
  // has not already authorized this app and aborts sign-in without any UI.
  const nonce = randomNonce();
  try {
    const credential = await GoogleOneTapSignIn.signInWithGoogle(webClientId, nonce);
    if (!credential.idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }
    return { idToken: credential.idToken, nonce };
  } catch (e) {
    if (isUserCancelled(e)) {
      return null;
    }
    throw e;
  }
}
