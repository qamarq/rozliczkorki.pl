import { authRouter } from "./routers/auth";
import { lessonsRouter } from "./routers/lessons";
import { pushTokensRouter } from "./routers/pushTokens";
import { recurringRouter } from "./routers/recurring";
import { schoolsRouter } from "./routers/schools";
import { statsRouter } from "./routers/stats";
import { studentsRouter } from "./routers/students";
import { vacationsRouter } from "./routers/vacations";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  students: studentsRouter,
  schools: schoolsRouter,
  vacations: vacationsRouter,
  lessons: lessonsRouter,
  recurring: recurringRouter,
  stats: statsRouter,
  pushTokens: pushTokensRouter,
});

export type AppRouter = typeof appRouter;
