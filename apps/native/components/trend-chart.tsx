import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";
import { Skeleton } from "@/components/skeleton";
import { colors, radius } from "@/lib/theme";

export type TrendPoint = {
  label: string;
  value: number;
  previous: number | null;
  forecast: boolean;
};

const HEIGHT = 170;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 22;

function buildPath(coords: { x: number; y: number }[]) {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    const only = coords[0]!;
    return `M ${only.x} ${only.y} L ${only.x} ${only.y}`;
  }
  return coords
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function TrendChart({
  points,
  formatValue,
  loading,
}: {
  points: TrendPoint[];
  formatValue: (value: number) => string;
  loading?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (loading) {
    return (
      <View
        style={styles.empty}
        onLayout={onLayout}
        accessibilityRole="progressbar"
        accessibilityLabel="Wczytywanie wykresu"
      >
        <Skeleton
          height={HEIGHT - 32}
          style={{ width: "100%", borderRadius: radius.md }}
        />
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.empty} onLayout={onLayout}>
        <Text style={styles.emptyText}>Brak danych w tym zakresie</Text>
      </View>
    );
  }

  const max = Math.max(...points.map((p) => Math.max(p.value, p.previous ?? 0)), 1);
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((point, i) => ({
    x: points.length > 1 ? i * step : width / 2,
    y: PADDING_TOP + plotHeight - (point.value / max) * plotHeight,
  }));

  const hasPrevious = points.some((p) => p.previous != null);
  const previousCoords = hasPrevious
    ? points.map((point, i) => ({
        x: points.length > 1 ? i * step : width / 2,
        y: PADDING_TOP + plotHeight - ((point.previous ?? 0) / max) * plotHeight,
      }))
    : [];

  const firstForecast = points.findIndex((p) => p.forecast);
  const splitAt = firstForecast === -1 ? points.length : Math.max(firstForecast - 1, 0);
  const actual = coords.slice(0, firstForecast === -1 ? points.length : firstForecast);
  const forecast = firstForecast === -1 ? [] : coords.slice(splitAt);

  const areaPath =
    actual.length > 0
      ? `${buildPath(actual)} L ${actual.at(-1)!.x} ${HEIGHT - PADDING_BOTTOM} L ${actual[0]!.x} ${HEIGHT - PADDING_BOTTOM} Z`
      : "";

  const selected = active != null ? points[active] : undefined;
  const selectedCoord = active != null ? coords[active] : undefined;

  const pick = (x: number) => {
    if (points.length === 1) return 0;
    const index = Math.round(x / (step || 1));
    return Math.min(points.length - 1, Math.max(0, index));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.readout}>
        <Text style={styles.readoutValue}>
          {formatValue(selected?.value ?? points.at(-1)?.value ?? 0)}
        </Text>
        <Text style={styles.readoutLabel}>
          {selected?.label ?? points.at(-1)?.label ?? ""}
          {(selected ?? points.at(-1))?.forecast ? " · prognoza" : ""}
        </Text>
      </View>

      <View
        onLayout={onLayout}
        style={{ height: HEIGHT }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => setActive(pick(e.nativeEvent.locationX))}
        onResponderMove={(e) => setActive(pick(e.nativeEvent.locationX))}
        onResponderRelease={() => setActive(null)}
        onResponderTerminate={() => setActive(null)}
      >
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <SvgGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accentTo} stopOpacity={0.35} />
                <Stop offset="1" stopColor={colors.accentTo} stopOpacity={0} />
              </SvgGradient>
            </Defs>

            <Line
              x1={0}
              y1={HEIGHT - PADDING_BOTTOM}
              x2={width}
              y2={HEIGHT - PADDING_BOTTOM}
              stroke={colors.border}
              strokeWidth={1}
            />

            {areaPath !== "" && <Path d={areaPath} fill="url(#area)" />}
            {previousCoords.length > 1 && (
              <Path
                d={buildPath(previousCoords)}
                stroke={colors.success}
                strokeWidth={2}
                strokeDasharray="6 5"
                fill="none"
              />
            )}
            {actual.length > 0 && (
              <Path
                d={buildPath(actual)}
                stroke={colors.accentTo}
                strokeWidth={2.5}
                fill="none"
              />
            )}
            {forecast.length > 1 && (
              <Path
                d={buildPath(forecast)}
                stroke={colors.accentFrom}
                strokeWidth={2.5}
                strokeDasharray="6 5"
                fill="none"
              />
            )}

            {selectedCoord && (
              <>
                <Line
                  x1={selectedCoord.x}
                  y1={PADDING_TOP - 6}
                  x2={selectedCoord.x}
                  y2={HEIGHT - PADDING_BOTTOM}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <Circle
                  cx={selectedCoord.x}
                  cy={selectedCoord.y}
                  r={5}
                  fill={colors.text}
                  stroke={colors.accentTo}
                  strokeWidth={2}
                />
              </>
            )}
          </Svg>
        )}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{points[0]?.label}</Text>
        <Text style={styles.axisLabel}>{points.at(-1)?.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  readout: { gap: 2 },
  readoutValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  readoutLabel: { color: colors.textMuted, fontSize: 12, textTransform: "capitalize" },
  axis: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { color: colors.textFaint, fontSize: 11, textTransform: "capitalize" },
  empty: {
    height: HEIGHT,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
