import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "@/lib/theme";

/**
 * Line boxes are pinned to the same numbers the loaded cards set as `lineHeight`,
 * so a placeholder row and the real row it stands in for resolve to equal height.
 */
export const lineHeights = { title: 20, body: 17, tile: 24, total: 28, hero: 38 };

function useReduceMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

export function Skeleton({
  width,
  height = 12,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: object;
}) {
  const [measured, setMeasured] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!measured || reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [measured, reduceMotion]);

  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[
        styles.base,
        { height, borderRadius: Math.min(height / 2, radius.sm) },
        width !== undefined && { width },
        style,
      ]}
    >
      {measured > 0 && !reduceMotion && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-measured, measured],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["transparent", colors.surfaceHover, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** A bar centred in a line box of the same height as the text it replaces. */
export function SkeletonLine({
  lineHeight = lineHeights.body,
  barHeight = 12,
  width,
  style,
}: {
  lineHeight?: number;
  barHeight?: number;
  width?: number | `${number}%`;
  style?: object;
}) {
  return (
    <View style={[{ height: lineHeight, justifyContent: "center" }, style]}>
      <Skeleton height={barHeight} width={width} />
    </View>
  );
}

export function SkeletonCard({
  lines = 2,
  badge = false,
  style,
}: {
  lines?: number;
  badge?: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <SkeletonLine
          lineHeight={lineHeights.title}
          barHeight={14}
          style={{ flex: 1, maxWidth: "55%" }}
        />
        {badge && <Skeleton width={62} height={20} />}
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} style={{ maxWidth: i === 0 ? "70%" : "45%" }} />
      ))}
    </View>
  );
}

export function SkeletonList({
  count = 4,
  lines = 2,
  badge = false,
}: {
  count?: number;
  lines?: number;
  badge?: boolean;
}) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Wczytywanie">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cardWrap}>
          <SkeletonCard lines={lines} badge={badge} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceHover, overflow: "hidden" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardWrap: { paddingHorizontal: 20 },
});
