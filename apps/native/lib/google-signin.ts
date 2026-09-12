import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { GoogleOneTapSignIn } from "react-native-google-one-tap-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type GoogleCredential = { idToken: string; nonce?: string };

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

let configured = false;

function configureAccountPicker() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

async function signInWithAccountPicker(): Promise<GoogleCredential | null> {
  configureAccountPicker();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") {
      return null;
    }
    if (!response.data.idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }
    return { idToken: response.data.idToken };
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw e;
  }
}

async function signInWithOneTap(): Promise<GoogleCredential | null> {
  // The nonce is not only replay protection: passing one makes the native module
  // drop setFilterByAuthorizedAccounts, which otherwise hides every account that
  // has not already authorized this app and aborts sign-in without any UI.
  const nonce = randomNonce();
  const credential = await GoogleOneTapSignIn.signInWithGoogle(webClientId, nonce);
  if (!credential.idToken) {
    throw new Error("One Tap sign-in did not return an ID token");
  }
  return { idToken: credential.idToken, nonce };
}

export async function getGoogleIdToken(): Promise<GoogleCredential | null> {
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured");
  }

  // One Tap is Android-only, and it rejects with NO_CREDENTIAL whenever the
  // device has nothing it considers usable, so the account picker stays as the
  // fallback for everything except an explicit cancellation.
  if (Platform.OS === "android") {
    try {
      return await signInWithOneTap();
    } catch (e) {
      if (isUserCancelled(e)) {
        return null;
      }
      console.warn("One Tap sign-in unavailable, falling back to account picker", e);
    }
  }

  return signInWithAccountPicker();
}
