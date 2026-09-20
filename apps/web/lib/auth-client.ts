import { passkeyClient } from "@better-auth/passkey/client";
import { oneTapClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const authClient = createAuthClient({
  plugins: [
    passkeyClient(),
    oneTapClient({ clientId: googleClientId, promptOptions: { fedCM: true } }),
  ],
});
export const { signIn, signOut, signUp, useSession } = authClient;
