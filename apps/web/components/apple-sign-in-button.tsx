"use client";

import { AppleIcon } from "@/components/apple-icon";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { authClient } from "@/lib/auth-client";

type Props = {
  callbackURL: string;
  label?: string;
  className?: string;
  onClick?: () => void;
  onError: (message: string) => void;
};

export function AppleSignInButton({
  callbackURL,
  label = "Apple",
  className,
  onClick,
  onError,
}: Props) {
  async function onSignIn() {
    onClick?.();
    const { error } = await authClient.signIn.social({ provider: "apple", callbackURL });
    if (error) onError(error.message ?? "Nie udało się zalogować przez Apple");
  }

  return (
    <Button
      variant="outline"
      type="button"
      className={cn("w-full", className)}
      onClick={onSignIn}
    >
      <AppleIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
