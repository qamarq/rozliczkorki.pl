"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleIcon } from "@/components/google-icon";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { renderGoogleButton, signInWithGoogleRedirect } from "@/lib/google-sign-in";

type Props = {
  context: "signin" | "signup";
  callbackURL: string;
  label?: string;
  className?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({
  context,
  callbackURL,
  label = "Google",
  className,
  onSuccess,
  onError,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [width, setWidth] = useState(0);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = overlayRef.current;
    if (!container || width === 0) return;
    let cancelled = false;
    renderGoogleButton({
      container,
      context,
      width,
      onSuccess: () => onSuccessRef.current(),
      onError: (message) => onErrorRef.current(message),
    })
      .then((ok) => !cancelled && setRendered(ok))
      .catch(() => !cancelled && setRendered(false));
    return () => {
      cancelled = true;
    };
  }, [context, width]);

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        variant="outline"
        type="button"
        className={cn("w-full", className)}
        onClick={() => signInWithGoogleRedirect(callbackURL)}
      >
        <GoogleIcon data-icon="inline-start" />
        {label}
      </Button>
      {/* Google's own button has to receive the click for the FedCM chooser to open. */}
      <div
        ref={overlayRef}
        className={
          rendered ? "absolute inset-0 z-10 overflow-hidden opacity-0" : "hidden"
        }
      />
    </div>
  );
}
