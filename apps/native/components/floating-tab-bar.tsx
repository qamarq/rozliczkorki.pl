import {
  Box,
  HorizontalFloatingToolbar,
  Host,
  Icon,
  Row,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  animateContentSize,
  background,
  clip,
  fillMaxSize,
  height,
  padding,
  selectable,
  Shapes,
  tween,
  width,
} from "@expo/ui/jetpack-compose/modifiers";
import { type Tabs, useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openSchoolSheet } from "@/components/school-sheet";
import { openStudentSheet } from "@/components/student-sheet";
import { openVacationSheet } from "@/components/vacation-sheet";
import { getNewLessonHref } from "@/lib/new-lesson";
import { colors } from "@/lib/theme";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ACTIVE_BG = "#35295e";
const ACTIVE_FG = "#ddd6fe";
const TRANSPARENT = "#00000000";
const LABEL_WIDTH = 76;

const TABS: Record<string, { label: string; icon: number; activeIcon: number }> = {
  index: {
    label: "Kalendarz",
    icon: require("../assets/icons/calendar_month_rounded.xml"),
    activeIcon: require("../assets/icons/calendar_month_rounded_fill.xml"),
  },
  students: {
    label: "Uczniowie",
    icon: require("../assets/icons/group_rounded.xml"),
    activeIcon: require("../assets/icons/group_rounded_fill.xml"),
  },
  schools: {
    label: "Szkółki",
    icon: require("../assets/icons/school_rounded.xml"),
    activeIcon: require("../assets/icons/school_rounded_fill.xml"),
  },
  vacations: {
    label: "Urlopy",
    icon: require("../assets/icons/flight_rounded.xml"),
    activeIcon: require("../assets/icons/flight_rounded_fill.xml"),
  },
};

const ADD_ICON = require("../assets/icons/add_rounded.xml");

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const current = state.routes[state.index]?.name;

  function addForCurrentTab() {
    if (current === "students") openStudentSheet();
    else if (current === "schools") openSchoolSheet();
    else if (current === "vacations") openVacationSheet();
    else router.push(getNewLessonHref());
  }

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 8 }]}>
      <Host style={styles.host} colorScheme="dark" seedColor={colors.accentTo}>
        <Box modifiers={[fillMaxSize()]} contentAlignment="center">
          <HorizontalFloatingToolbar
            colors={{
              toolbarContainerColor: colors.surfaceHover,
              toolbarContentColor: colors.textMuted,
              fabContainerColor: colors.accentFrom,
              fabContentColor: "#ffffff",
            }}
          >
            {state.routes.map((route, index) => {
              const tab = TABS[route.name];
              if (!tab) return null;
              const focused = index === state.index;
              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              };
              return (
                <Row
                  key={route.key}
                  verticalAlignment="center"
                  modifiers={[
                    clip(Shapes.RoundedCorner(24)),
                    background(focused ? ACTIVE_BG : TRANSPARENT, {
                      animationSpec: tween({ durationMillis: 250 }),
                    }),
                    selectable(focused, onPress, "tab"),
                    height(48),
                    padding(12, 0, 12, 0),
                    animateContentSize(0.9, 600),
                  ]}
                >
                  <Icon
                    source={focused ? tab.activeIcon : tab.icon}
                    size={24}
                    tint={focused ? ACTIVE_FG : colors.textMuted}
                    contentDescription={tab.label}
                  />
                  {focused && (
                    <Text
                      color={ACTIVE_FG}
                      maxLines={1}
                      overflow="ellipsis"
                      style={{ fontSize: 14, fontWeight: "600", textAlign: "center" }}
                      modifiers={[padding(8, 0, 4, 0), width(LABEL_WIDTH)]}
                    >
                      {tab.label}
                    </Text>
                  )}
                </Row>
              );
            })}
            <HorizontalFloatingToolbar.FloatingActionButton onPress={addForCurrentTab}>
              <Icon source={ADD_ICON} size={24} contentDescription="Dodaj" />
            </HorizontalFloatingToolbar.FloatingActionButton>
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0 },
  host: { height: 80 },
});
