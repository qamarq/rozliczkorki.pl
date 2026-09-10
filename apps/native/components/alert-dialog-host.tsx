import { BlurView } from "expo-blur";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GradientButton, OutlineButton } from "@/components/ui";
import { dismissAlert, subscribeAlert, type AlertState } from "@/lib/alert";
import { colors, radius } from "@/lib/theme";

export function AlertDialogHost({ blurTarget }: { blurTarget: RefObject<View | null> }) {
  const [state, setState] = useState<AlertState>(null);
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeAlert(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: state ? 1 : 0,
      duration: state ? 180 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      dismissAlert();
      return true;
    });
    return () => sub.remove();
  }, [state]);

  if (!state) return null;

  function handle(onPress?: () => void) {
    dismissAlert();
    onPress?.();
  }

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        blurTarget={blurTarget}
        blurMethod="dimezisBlurView"
        intensity={60}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={dismissAlert} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { width: Math.min(360, width - 48), opacity: progress, transform: [{ scale }] },
          ]}
        >
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
          <View style={styles.buttons}>
            {state.buttons.map((b, i) =>
              b.style === "default" || b.style == null ? (
                <GradientButton
                  key={i}
                  label={b.text}
                  onPress={() => handle(b.onPress)}
                />
              ) : (
                <OutlineButton
                  key={i}
                  label={b.text}
                  tone={b.style === "destructive" ? "danger" : "default"}
                  onPress={() => handle(b.onPress)}
                />
              ),
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: "rgba(4,4,8,0.5)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  message: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  buttons: { gap: 8, marginTop: 6 },
});
