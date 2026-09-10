import { Redirect, Stack } from "expo-router";
import { useSession } from "@/lib/auth-client";

export default function AuthLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) return null;
  if (session?.user) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
