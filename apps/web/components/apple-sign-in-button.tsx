"use client";

import { AppleIcon } from "@/components/apple-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Props = {
  callbackURL: string;
  label?: string;
  onClick?: () => void;
  onError: (message: string) => void;
};

export function AppleSignInButton({
  callbackURL,
  label = "Apple",
  onClick,
  onError,
}: Props) {
  async function onSignIn() {
    onClick?.();
    const { error } = await authClient.signIn.social({ provider: "apple", callbackURL });
    if (error) onError(error.message ?? "Nie udało się zalogować przez Apple");
  }

  return (
    <Button variant="outline" type="button" className="w-full" onClick={onSignIn}>
      <AppleIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
