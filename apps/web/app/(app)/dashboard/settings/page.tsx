"use client";

import { useRouter } from "next/navigation";
import { SettingsDialog } from "@/components/settings-dialog";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <SettingsDialog
      open
      onOpenChange={(open) => {
        if (!open) router.push("/dashboard");
      }}
    />
  );
}
