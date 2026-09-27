import { calendarFeeds } from "@repo/db";
import { eq } from "drizzle-orm";
import { calendarFeedLinks, newCalendarFeedToken } from "../calendar-feed";
import { protectedProcedure, router } from "../trpc";

function present(feed: typeof calendarFeeds.$inferSelect) {
  return {
    ...calendarFeedLinks(feed.token),
    createdAt: feed.createdAt,
    lastFetchedAt: feed.lastFetchedAt,
  };
}

export const calendarFeedRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [feed] = await ctx.db
      .select()
      .from(calendarFeeds)
      .where(eq(calendarFeeds.userId, ctx.session.user.id));
    return feed ? present(feed) : null;
  }),

  enable: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .insert(calendarFeeds)
      .values({ userId: ctx.session.user.id, token: newCalendarFeedToken() })
      .onConflictDoNothing({ target: calendarFeeds.userId });
    const [feed] = await ctx.db
      .select()
      .from(calendarFeeds)
      .where(eq(calendarFeeds.userId, ctx.session.user.id));
    return present(feed!);
  }),

  regenerate: protectedProcedure.mutation(async ({ ctx }) => {
    const [feed] = await ctx.db
      .insert(calendarFeeds)
      .values({ userId: ctx.session.user.id, token: newCalendarFeedToken() })
      .onConflictDoUpdate({
        target: calendarFeeds.userId,
        set: {
          token: newCalendarFeedToken(),
          lastFetchedAt: null,
          createdAt: new Date(),
        },
      })
      .returning();
    return present(feed!);
  }),

  disable: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(calendarFeeds)
      .where(eq(calendarFeeds.userId, ctx.session.user.id));
    return { success: true };
  }),
});
