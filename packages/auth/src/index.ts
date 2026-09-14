import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import {
  db,
  account,
  passkey as passkeyTable,
  session,
  user,
  verification,
} from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { actionEmail, sendEmail } from "./email";

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin: string) => origin.trim())
  .filter(Boolean);

// Android apps sign WebAuthn requests with android:apk-key-hash:<base64url SHA-256 of the signing cert>.
const ANDROID_APK_KEY_HASHES = [
  "07RX20u0maNUfm94yVrKwXmWmxx_qM2-aoFVQ1YFO18",
  "29WbsTk-wf7yTBS8TRXg4tVfY3QnpneH_k086B2MLFA",
];

const passkeyOrigins = [
  ...(process.env.BETTER_AUTH_URL ? [new URL(process.env.BETTER_AUTH_URL).origin] : []),
  ...ANDROID_APK_KEY_HASHES.map((hash) => `android:apk-key-hash:${hash}`),
];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, passkey: passkeyTable },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      const { html, text } = actionEmail({
        heading: "Zresetuj hasło",
        intro: `Cześć ${user.name}! Kliknij poniższy przycisk, żeby ustawić nowe hasło do RozliczKorki. Link jest ważny przez godzinę.`,
        buttonLabel: "Ustaw nowe hasło",
        url,
        outro:
          "Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość — hasło pozostanie bez zmian.",
      });
      await sendEmail({
        to: user.email,
        subject: "Zresetuj hasło w RozliczKorki",
        html,
        text,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const { html, text } = actionEmail({
        heading: "Potwierdź swój adres e-mail",
        intro: `Cześć ${user.name}! Potwierdź adres, żeby aktywować konto w RozliczKorki.`,
        buttonLabel: "Potwierdź e-mail",
        url,
        outro: "Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.",
      });
      await sendEmail({
        to: user.email,
        subject: "Potwierdź e-mail w RozliczKorki",
        html,
        text,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      async sendChangeEmailConfirmation({ user, newEmail, url }) {
        const { html, text } = actionEmail({
          heading: "Potwierdź zmianę adresu e-mail",
          intro: `Cześć ${user.name}! Ktoś poprosił o zmianę adresu konta na ${newEmail}. Potwierdź, jeśli to Ty.`,
          buttonLabel: "Potwierdź zmianę",
          url,
          outro: "Jeśli to nie Ty, zignoruj tę wiadomość — adres pozostanie bez zmian.",
        });
        await sendEmail({
          to: user.email,
          subject: "Potwierdź zmianę adresu e-mail",
          html,
          text,
        });
      },
    },
    deleteUser: {
      enabled: true,
      async sendDeleteAccountVerification({ user, url }) {
        const { html, text } = actionEmail({
          heading: "Potwierdź usunięcie konta",
          intro: `Cześć ${user.name}! Potwierdź usunięcie konta w RozliczKorki. Tej operacji nie da się cofnąć — znikną wszystkie lekcje, stawki i dane uczniów.`,
          buttonLabel: "Usuń konto na zawsze",
          url,
          outro: "Jeśli to nie Ty, zignoruj tę wiadomość — konto zostanie nietknięte.",
        });
        await sendEmail({
          to: user.email,
          subject: "Potwierdź usunięcie konta w RozliczKorki",
          html,
          text,
        });
      },
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : undefined,
  trustedOrigins,
  advanced: {
    cookiePrefix: process.env.AUTH_COOKIE_PREFIX ?? "better-auth",
  },
  plugins: [
    passkey({ rpName: "RozliczKorki", origin: passkeyOrigins }),
    expo(),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
