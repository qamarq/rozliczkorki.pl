import { ProgressiveBlurView } from "expo-backdrop";
import { LinearGradient } from "expo-linear-gradient";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import {
  Animated,
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
const HEADER_SCRIM_SCROLL = 24;
const HEADER_SCRIM = "rgb(27, 22, 45)";
const HEADER_SCRIM_CLEAR = "rgba(27, 22, 45, 0)";
const TAB_BAR_SCRIM = [
  "rgba(11, 11, 16, 0)",
  "rgba(11, 11, 16, 0.75)",
  "rgba(11, 11, 16, 0.95)",
] as const;
const blurSupported = Platform.OS === "ios";
const scrimSupported = Platform.OS === "android";

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
  onScroll,
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useMemo(
    () =>
      scrimSupported
        ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
            listener: onScroll,
          })
        : onScroll,
    [onScroll, scrollY],
  );
  const headerHeight = top + HEADER_FADE;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={ref}
        scrollEventThrottle={16}
        {...props}
        onScroll={handleScroll}
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
      {scrimSupported && top > 0 && (
        <Animated.View
          style={[
            styles.headerBlur,
            {
              height: headerHeight,
              opacity: scrollY.interpolate({
                inputRange: [0, HEADER_SCRIM_SCROLL],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[HEADER_SCRIM, HEADER_SCRIM, HEADER_SCRIM_CLEAR]}
            locations={[0, top / headerHeight, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {blurSupported && top > 0 && (
        <View collapsable={false} style={[styles.headerBlur, { height: headerHeight }]}>
          <ProgressiveBlurView
            edge="top"
            intensity={100}
            tint="systemUltraThinMaterialDark"
            tintColor="rgba(27, 22, 45, 0.8)"
            scrollFallback={false}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {scrimSupported && overTabBar && (
        <View style={[styles.tabBar, { height: tabBarSpace || insets.bottom + 72 }]}>
          <LinearGradient
            colors={TAB_BAR_SCRIM}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {blurSupported && overTabBar && (
        <View
          collapsable={false}
          style={[styles.tabBar, { height: tabBarSpace || insets.bottom + 72 }]}
        >
          <ProgressiveBlurView
            edge="bottom"
            intensity={100}
            tint="systemUltraThinMaterialDark"
            tintColor="rgba(11, 11, 16, 0.8)"
            scrollFallback={false}
            style={StyleSheet.absoluteFill}
          />
        </View>
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
