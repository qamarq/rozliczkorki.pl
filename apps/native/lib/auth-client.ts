import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: "korkomat",
      storagePrefix: "korkomat",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;
