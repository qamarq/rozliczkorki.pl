import { authRouter } from "./routers/auth";
import { iosWaitlistRouter } from "./routers/iosWaitlist";
import { lessonsRouter } from "./routers/lessons";
import { pushTokensRouter } from "./routers/pushTokens";
import { recurringRouter } from "./routers/recurring";
import { statsRouter } from "./routers/stats";
import { studentsRouter } from "./routers/students";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  students: studentsRouter,
  lessons: lessonsRouter,
  recurring: recurringRouter,
  stats: statsRouter,
  pushTokens: pushTokensRouter,
  iosWaitlist: iosWaitlistRouter,
});

export type AppRouter = typeof appRouter;
