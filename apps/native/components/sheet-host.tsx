import { BlurView } from "expo-blur";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { closeSheet, subscribeSheet, type SheetState } from "@/lib/sheet";
import { colors, radius } from "@/lib/theme";

const MARGIN = 12;
const HANDLE_HEIGHT = 21;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 200;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1.1;

export function SheetHost({ blurTarget }: { blurTarget: RefObject<View | null> }) {
  const [state, setState] = useState<SheetState>(null);
  const [visible, setVisible] = useState<SheetState>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fullHeight = Math.round(height - insets.top - insets.bottom - MARGIN * 2);
  const baseHeight = Math.min(
    contentHeight > 0 ? Math.ceil(contentHeight) + HANDLE_HEIGHT : Math.round(height * 0.5),
    fullHeight,
  );
  const hiddenY = fullHeight + MARGIN + insets.bottom;

  const sheetHeight = useRef(new Animated.Value(baseHeight)).current;
  const translateY = useRef(new Animated.Value(hiddenY)).current;
  const current = useRef({ height: baseHeight, y: hiddenY });
  const dragStart = useRef({ height: baseHeight, y: 0 });
  const dragging = useRef(false);
  const snap = useRef({ baseHeight, fullHeight });
  snap.current = { baseHeight, fullHeight };

  useEffect(() => {
    const h = sheetHeight.addListener(({ value }) => {
      current.current.height = value;
    });
    const t = translateY.addListener(({ value }) => {
      current.current.y = value;
    });
    return () => {
      sheetHeight.removeListener(h);
      translateY.removeListener(t);
    };
  }, [sheetHeight, translateY]);

  useEffect(() => {
    const unsubscribe = subscribeSheet(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state) {
      setContentHeight(0);
      setVisible(state);
      translateY.setValue(hiddenY);
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }
    if (!visible) return;
    Animated.timing(translateY, {
      toValue: hiddenY,
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setVisible(null);
    });
  }, [state]);

  useEffect(() => {
    if (!visible || dragging.current) return;
    Animated.spring(sheetHeight, {
      toValue: baseHeight,
      useNativeDriver: false,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [baseHeight, visible]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStart.current = { height: current.current.height, y: current.current.y };
      },
      onPanResponderMove: (_, g) => {
        const { baseHeight: base, fullHeight: full } = snap.current;
        const desired = dragStart.current.height - g.dy;
        if (desired >= base) {
          sheetHeight.setValue(Math.min(desired, full));
          translateY.setValue(0);
          return;
        }
        sheetHeight.setValue(base);
        translateY.setValue(base - desired);
      },
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        const { baseHeight: base, fullHeight: full } = snap.current;
        if (current.current.y > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeSheet();
          return;
        }
        const target =
          g.vy < -0.5 || current.current.height > (base + full) / 2 ? full : base;
        Animated.parallel([
          Animated.spring(sheetHeight, {
            toValue: target,
            useNativeDriver: false,
            bounciness: 2,
            speed: 14,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
            speed: 16,
          }),
        ]).start();
      },
    }),
  ).current;

  if (!visible) return null;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, hiddenY],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BlurView
        blurTarget={blurTarget}
        blurMethod="dimezisBlurView"
        intensity={60}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            bottom: MARGIN + insets.bottom,
            transform: [{ translateY }],
          },
        ]}
      >
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurView"
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheetTint} />
        <View style={styles.handleZone} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={(_, h) => setContentHeight(h)}
        >
          {visible.render()}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: "rgba(4,4,8,0.5)" },
  sheet: {
    position: "absolute",
    left: MARGIN,
    right: MARGIN,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(19,19,24,0.86)",
  },
  handleZone: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
});
