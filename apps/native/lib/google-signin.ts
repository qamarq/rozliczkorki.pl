import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;

function configure() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

export async function getGoogleIdToken() {
  if (Platform.OS !== "android") {
    throw new Error("Google sign-in is only implemented on Android right now");
  }
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured");
  }

  configure();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") {
      return null;
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }
    return { idToken };
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw e;
  }
}
