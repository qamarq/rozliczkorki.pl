"use client";

import { authClient, googleClientId } from "@/lib/auth-client";

type GsiIdConfiguration = {
  client_id: string;
  callback: (response: { credential: string }) => void;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  itp_support?: boolean;
  use_fedcm_for_button?: boolean;
  button_auto_select?: boolean;
};

type GsiButtonConfiguration = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "small" | "medium" | "large";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GsiIdConfiguration) => void;
          renderButton: (parent: HTMLElement, config: GsiButtonConfiguration) => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | undefined;

function loadGsi() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Nie udało się wczytać Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function signInWithGoogleRedirect(callbackURL: string) {
  return authClient.signIn.social({ provider: "google", callbackURL });
}

type RenderOptions = {
  container: HTMLElement;
  context: "signin" | "signup";
  width: number;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export async function renderGoogleButton({
  container,
  context,
  width,
  onSuccess,
  onError,
}: RenderOptions) {
  if (!googleClientId) return false;

  await loadGsi();
  const id = window.google?.accounts.id;
  if (!id) return false;

  id.initialize({
    client_id: googleClientId,
    context,
    ux_mode: "popup",
    itp_support: true,
    use_fedcm_for_button: true,
    button_auto_select: false,
    callback: async ({ credential }) => {
      const { error } = await authClient.$fetch("/one-tap/callback", {
        method: "POST",
        body: { idToken: credential },
      });
      if (error) {
        onError(error.message ?? "Nie udało się zalogować przez Google");
        return;
      }
      authClient.$store.notify("$sessionSignal");
      onSuccess();
    },
  });

  container.replaceChildren();
  id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: context === "signup" ? "signup_with" : "signin_with",
    shape: "rectangular",
    logo_alignment: "center",
    width,
  });

  return true;
}
