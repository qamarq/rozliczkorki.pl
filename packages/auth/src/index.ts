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
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : undefined,
  trustedOrigins,
  advanced: {
    cookiePrefix: process.env.AUTH_COOKIE_PREFIX ?? "better-auth",
  },
  plugins: [passkey({ rpName: "RozliczKorki" }), expo(), nextCookies()],
});

export type Auth = typeof auth;
