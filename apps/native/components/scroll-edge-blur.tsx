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
import { floatingTabBarSpace } from "@/lib/theme";

const HEADER_FADE = 48;
const blurSupported = Platform.OS !== "web";

const HeaderHeightContext = createContext(0);
const OverTabBarContext = createContext(false);

export function useHeaderHeight() {
  return useContext(HeaderHeightContext);
}

function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "android" ? insets.bottom + floatingTabBarSpace : 0;
}

export function BlurHeader({
  header,
  banner,
  overTabBar,
  children,
}: {
  header: ReactNode;
  banner?: ReactNode;
  overTabBar?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  return (
    <View style={styles.container}>
      <HeaderHeightContext.Provider value={height}>
        <OverTabBarContext.Provider value={!!overTabBar}>
          {height > 0 && children}
        </OverTabBarContext.Provider>
      </HeaderHeightContext.Provider>
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
  const insets = useSafeAreaInsets();
  const overTabBar = useContext(OverTabBarContext);
  const tabBarSpace = useTabBarSpace();
  const bottom = overTabBar ? tabBarSpace : 0;
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const paddingTop =
    Number(flat.paddingTop ?? flat.paddingVertical ?? flat.padding ?? 0) + top;
  const paddingBottom =
    Number(flat.paddingBottom ?? flat.paddingVertical ?? flat.padding ?? 0) + bottom;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={ref}
        {...props}
        contentContainerStyle={[contentContainerStyle, { paddingTop, paddingBottom }]}
        scrollIndicatorInsets={{ top, bottom }}
        refreshControl={
          isValidElement(refreshControl)
            ? cloneElement(refreshControl as ReactElement<RefreshControlProps>, {
                progressViewOffset: top,
              })
            : refreshControl
        }
      />
      {blurSupported && top > 0 && (
        <ProgressiveBlurView
          edge="top"
          intensity={100}
          tint="systemUltraThinMaterialDark"
          tintColor="rgba(27, 22, 45, 0.8)"
          scrollFallback={false}
          style={[styles.headerBlur, { height: top + HEADER_FADE }]}
        />
      )}
      {blurSupported && overTabBar && (
        <ProgressiveBlurView
          edge="bottom"
          intensity={100}
          tint="systemUltraThinMaterialDark"
          tintColor="rgba(11, 11, 16, 0.8)"
          scrollFallback={false}
          style={[styles.tabBar, { height: tabBarSpace || insets.bottom + 72 }]}
        />
      )}
    </View>
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
