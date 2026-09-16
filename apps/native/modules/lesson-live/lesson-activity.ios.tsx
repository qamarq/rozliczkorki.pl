import { HStack, Image, ProgressView, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  createLiveActivity,
  type LiveActivity,
  type LiveActivityEnvironment,
} from "expo-widgets";
import type { LiveLesson } from "./index";

type LessonActivityProps = {
  lessonId: string;
  studentName: string;
  startsAt: number;
  endsAt: number;
  paid: boolean;
};

const LessonActivityLayout = (
  props: LessonActivityProps,
  environment: LiveActivityEnvironment,
) => {
  "widget";
  const accent = "#8B5CF6";
  const wrapUp = "#34D399";
  const muted = "#A1A1AA";
  const finished = environment.isStale === true;
  const range = { lower: new Date(props.startsAt), upper: new Date(props.endsAt) };

  const status = finished ? (
    <Text modifiers={[font({ size: 13 }), foregroundStyle(muted), lineLimit(1)]}>
      {props.paid ? "Zajęcia zakończone" : "Zajęcia zakończone · oznacz płatność"}
    </Text>
  ) : (
    <HStack spacing={0}>
      <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>
        Trwają zajęcia ·{" "}
      </Text>
      <Text
        date={new Date(props.startsAt)}
        dateStyle="time"
        modifiers={[font({ size: 13 }), foregroundStyle(muted)]}
      />
      <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>–</Text>
      <Text
        date={new Date(props.endsAt)}
        dateStyle="time"
        modifiers={[font({ size: 13 }), foregroundStyle(muted)]}
      />
    </HStack>
  );

  const progress = finished ? (
    <ProgressView value={1} modifiers={[tint(props.paid ? accent : wrapUp)]} />
  ) : (
    <ProgressView timerInterval={range} countsDown={false} modifiers={[tint(accent)]} />
  );

  const remaining = finished ? (
    <Image systemName="checkmark.circle.fill" color={props.paid ? accent : wrapUp} />
  ) : (
    <Text
      timerInterval={range}
      modifiers={[
        font({ size: 15, weight: "semibold" }),
        monospacedDigit(),
        foregroundStyle(accent),
        frame({ width: 56 }),
      ]}
    />
  );

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={10}
        modifiers={[padding({ all: 16 }), activityBackgroundTint("#16142A")]}
      >
        <HStack spacing={10}>
          <Image systemName="graduationcap.fill" color={accent} />
          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({ size: 16, weight: "semibold" }),
                foregroundStyle("#FFFFFF"),
                lineLimit(1),
              ]}
            >
              {props.studentName}
            </Text>
            {status}
          </VStack>
          <Spacer />
          {remaining}
        </HStack>
        {progress}
      </VStack>
    ),
    compactLeading: <Image systemName="graduationcap.fill" color={accent} />,
    compactTrailing: remaining,
    minimal: <Image systemName="graduationcap.fill" color={accent} />,
    expandedLeading: (
      <HStack spacing={8} modifiers={[padding({ leading: 8 })]}>
        <Image systemName="graduationcap.fill" color={accent} />
        <Text
          modifiers={[
            font({ size: 16, weight: "semibold" }),
            foregroundStyle("#FFFFFF"),
            lineLimit(1),
          ]}
        >
          {props.studentName}
        </Text>
      </HStack>
    ),
    expandedTrailing: <HStack modifiers={[padding({ trailing: 8 })]}>{remaining}</HStack>,
    expandedBottom: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 8 })]}>
        {status}
        {progress}
      </VStack>
    ),
  };
};

const LessonActivity = createLiveActivity("LessonActivity", LessonActivityLayout);

const STARTED_KEY = "lesson-activities-started";
const MAX_ACTIVITIES = 4;
const SCHEDULE_HORIZON_MS = 48 * 60 * 60 * 1000;
const canSchedule = parseInt(String(Platform.Version), 10) >= 26;

let queue = Promise.resolve();

function propsKey(props: LessonActivityProps) {
  return `${props.startsAt}:${props.endsAt}:${props.paid}:${props.studentName}`;
}

async function readStarted(): Promise<Record<string, string>> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(STARTED_KEY)) ?? "{}");
  } catch {
    return {};
  }
}

async function sync(lessons: LiveLesson[]) {
  const now = Date.now();
  const desired = lessons
    .filter(
      (l) => l.startsAt <= now || (canSchedule && l.startsAt < now + SCHEDULE_HORIZON_MS),
    )
    .sort((a, b) => a.startsAt - b.startsAt)
    .slice(0, MAX_ACTIVITIES)
    .map<LessonActivityProps>((l) => ({
      lessonId: l.id,
      studentName: l.studentName,
      startsAt: l.startsAt,
      endsAt: l.endsAt,
      paid: l.paid,
    }));
  const desiredById = new Map(desired.map((p) => [p.lessonId, p]));
  // Remembers which lessons already got an activity, so one the user swiped away is not recreated.
  const started = await readStarted();
  const existing = new Map<string, LiveActivity<LessonActivityProps>>();

  for (const activity of LessonActivity.getInstances()) {
    const current = activity.getProps();
    const next = current && desiredById.get(current.lessonId);
    if (!current || !next || existing.has(current.lessonId)) {
      await activity.end("immediate").catch(() => {});
      if (current && !existing.has(current.lessonId)) delete started[current.lessonId];
      continue;
    }
    if (propsKey(current) !== propsKey(next)) {
      if (current.startsAt > now) {
        await activity.end("immediate").catch(() => {});
        delete started[current.lessonId];
        continue;
      }
      await activity.update(next, new Date(next.endsAt)).catch(() => {});
      started[next.lessonId] = propsKey(next);
    }
    existing.set(current.lessonId, activity);
  }

  for (const props of desired) {
    if (existing.has(props.lessonId) || started[props.lessonId] === propsKey(props))
      continue;
    const url = `rozliczkorki://lesson/${props.lessonId}`;
    try {
      if (props.startsAt > now) {
        LessonActivity.start(props, url, new Date(props.endsAt), {
          startDate: new Date(props.startsAt),
          alert: { title: props.studentName, body: "Zajęcia właśnie się zaczynają" },
        });
      } else {
        LessonActivity.start(props, url, new Date(props.endsAt));
      }
      started[props.lessonId] = propsKey(props);
    } catch (e) {
      console.warn("Live Activity not started", e);
    }
  }

  const known = new Set(lessons.map((l) => l.id));
  for (const id of Object.keys(started)) {
    if (!known.has(id)) delete started[id];
  }
  await SecureStore.setItemAsync(STARTED_KEY, JSON.stringify(started));
}

export function syncLessonActivities(lessons: LiveLesson[]) {
  queue = queue
    .then(() => sync(lessons))
    .catch((e) => console.warn("Live Activity sync failed", e));
}
