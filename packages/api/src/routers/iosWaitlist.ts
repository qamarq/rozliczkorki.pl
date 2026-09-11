import { iosWaitlistVotes } from "@repo/db";
import { count, eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const BASE_VOTES = 13;

export const iosWaitlistRouter = router({
  status: publicProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select({ value: count() }).from(iosWaitlistVotes);
    const votes = BASE_VOTES + (row?.value ?? 0);

    if (!ctx.session) {
      return { votes, hasVoted: false, canVote: false };
    }

    const existing = await ctx.db
      .select({ userId: iosWaitlistVotes.userId })
      .from(iosWaitlistVotes)
      .where(eq(iosWaitlistVotes.userId, ctx.session.user.id))
      .limit(1);

    return { votes, hasVoted: existing.length > 0, canVote: true };
  }),

  vote: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .insert(iosWaitlistVotes)
      .values({ userId: ctx.session.user.id })
      .onConflictDoNothing();

    const [row] = await ctx.db.select({ value: count() }).from(iosWaitlistVotes);
    return { votes: BASE_VOTES + (row?.value ?? 0), hasVoted: true };
  }),
});
