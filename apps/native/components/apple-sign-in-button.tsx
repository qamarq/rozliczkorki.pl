import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform } from "react-native";
import { OutlineButton } from "@/components/ui";
import { alert } from "@/lib/alert";
import { signInWithApple } from "@/lib/apple-signin";
import { colors } from "@/lib/theme";

export function AppleSignInButton({ onStart }: { onStart?: () => void }) {
  const [loading, setLoading] = useState(false);

  if (Platform.OS !== "ios") return null;

  async function onPress() {
    setLoading(true);
    onStart?.();
    const result = await signInWithApple();
    setLoading(false);
    if (result.status === "error") alert("Błąd logowania", result.message);
  }

  return (
    <OutlineButton
      label="Kontynuuj przez Apple"
      icon={<Ionicons name="logo-apple" size={18} color={colors.text} />}
      onPress={onPress}
      disabled={loading}
    />
  );
}
