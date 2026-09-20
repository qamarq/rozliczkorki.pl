import { Host, List, RNHostView } from "@expo/ui";
import { Children, isValidElement, useState, type ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "@/lib/theme";

export function RefreshableList({
  children,
  onRefresh,
}: {
  children: ReactNode;
  onRefresh: () => Promise<unknown>;
}) {
  const { width } = useWindowDimensions();
  const items = Children.toArray(children).filter(isValidElement);
  const [refreshing, setRefreshing] = useState(false);

  if (Platform.OS !== "android") {
    return (
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.textMuted}
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
        {items}
      </ScrollView>
    );
  }

  return (
    <Host style={{ flex: 1 }} colorScheme="dark" seedColor={colors.accentTo}>
      <List
        key={items.length}
        onRefresh={async () => {
          await onRefresh();
        }}
      >
        {items.map((child, index) => (
          <RNHostView key={child.key ?? index} matchContents>
            <View style={{ width }}>{child}</View>
          </RNHostView>
        ))}
      </List>
    </Host>
  );
}
