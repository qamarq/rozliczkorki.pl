import { Host, List, RNHostView } from "@expo/ui";
import { Children, isValidElement, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
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
