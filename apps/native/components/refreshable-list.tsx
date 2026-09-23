import { useState, type ReactNode } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { colors } from "@/lib/theme";

export function RefreshableList({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh: () => Promise<unknown>;
}) {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.textMuted}
          colors={[colors.accentTo]}
          progressBackgroundColor={colors.surface}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await onRefresh();
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
