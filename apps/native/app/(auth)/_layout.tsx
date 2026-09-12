import { Redirect, Stack } from "expo-router";
import { useRef } from "react";
import { useSession } from "@/lib/auth-client";

export default function AuthLayout() {
  const { data: session, isPending } = useSession();
  // isPending goes true again on every focus refetch while logged out, and
  // unmounting the stack here would wipe the login form's state (e.g. after
  // returning from the autofill UI).
  const resolvedOnce = useRef(false);
  if (!isPending) resolvedOnce.current = true;

  if (isPending && !resolvedOnce.current) return null;
  if (session?.user) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
