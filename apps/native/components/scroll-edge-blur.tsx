import { ProgressiveBlurView } from "expo-backdrop";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  Platform,
  type RefreshControlProps,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_FADE = 48;
const blurSupported = Platform.OS !== "web";

const HeaderHeightContext = createContext(0);

export function useHeaderHeight() {
  return useContext(HeaderHeightContext);
}

export function BlurHeader({
  header,
  banner,
  children,
}: {
  header: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  return (
    <View style={styles.container}>
      <HeaderHeightContext.Provider value={height}>
        {height > 0 && children}
      </HeaderHeightContext.Provider>
      {blurSupported && height > 0 && (
        <ProgressiveBlurView
          edge="top"
          intensity={50}
          startOffset={height / (height + HEADER_FADE) - 0.25}
          tint="systemUltraThinMaterialDark"
          tintColor="rgba(27, 22, 45, 0.6)"
          scrollFallback={false}
          style={[styles.headerBlur, { height: height + HEADER_FADE }]}
        />
      )}
      <View
        style={[styles.header, { paddingTop: insets.top }]}
        onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
      >
        {header}
      </View>
      {banner != null && height > 0 && (
        <View style={[styles.banner, { top: height }]}>{banner}</View>
      )}
    </View>
  );
}

export function HeaderScrollView({
  ref,
  contentContainerStyle,
  refreshControl,
  ...props
}: ScrollViewProps & { ref?: Ref<ScrollView> }) {
  const top = useHeaderHeight();
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const paddingTop =
    Number(flat.paddingTop ?? flat.paddingVertical ?? flat.padding ?? 0) + top;

  return (
    <ScrollView
      ref={ref}
      {...props}
      contentContainerStyle={[contentContainerStyle, { paddingTop }]}
      scrollIndicatorInsets={{ top }}
      refreshControl={
        isValidElement(refreshControl)
          ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
              progressViewOffset: top,
            })
          : refreshControl
      }
    />
  );
}

export function TabBarEdgeBlur() {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== "ios") return null;
  return (
    <ProgressiveBlurView
      edge="bottom"
      tint="systemUltraThinMaterialDark"
      tintColor="rgba(11, 11, 16, 0.7)"
      scrollFallback={false}
      style={[styles.tabBar, { height: insets.bottom + 72 }]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: "absolute", top: 0, left: 0, right: 0 },
  banner: { position: "absolute", left: 0, right: 0 },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
});
