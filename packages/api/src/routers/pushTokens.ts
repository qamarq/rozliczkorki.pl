import { pushTokens } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const pushTokensRouter = router({
  register: protectedProcedure
    .input(z.object({ token: z.string().min(1), platform: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pushTokens)
        .values({
          userId: ctx.session.user.id,
          token: input.token,
          platform: input.platform,
        })
        .onConflictDoUpdate({
          target: pushTokens.token,
          set: { userId: ctx.session.user.id, platform: input.platform },
        });
      return { success: true };
    }),

  unregister: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pushTokens)
        .where(
          and(
            eq(pushTokens.token, input.token),
            eq(pushTokens.userId, ctx.session.user.id),
          ),
        );
      return { success: true };
    }),
});
