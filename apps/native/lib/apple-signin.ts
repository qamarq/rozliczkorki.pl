import * as AppleAuthentication from "expo-apple-authentication";
import { authClient } from "@/lib/auth-client";

export type AppleSignInResult =
  | { status: "signed-in" }
  | { status: "dismissed" }
  | { status: "error"; message: string };

export async function signInWithApple(): Promise<AppleSignInResult> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if ((e as { code?: string } | null)?.code === "ERR_REQUEST_CANCELED") {
      return { status: "dismissed" };
    }
    console.warn("Apple sign-in failed", e);
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Spróbuj ponownie",
    };
  }

  if (!credential.identityToken) {
    return { status: "error", message: "Apple nie zwróciło tokenu logowania" };
  }

  const { givenName, familyName } = credential.fullName ?? {};
  const { error } = await authClient.signIn.social({
    provider: "apple",
    idToken: {
      token: credential.identityToken,
      ...(givenName || familyName
        ? {
            user: {
              name: {
                firstName: givenName ?? undefined,
                lastName: familyName ?? undefined,
              },
              email: credential.email ?? undefined,
            },
          }
        : {}),
    },
  });

  return error
    ? { status: "error", message: error.message ?? "Spróbuj ponownie" }
    : { status: "signed-in" };
}
