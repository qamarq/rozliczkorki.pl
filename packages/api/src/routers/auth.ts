import { auth } from "@repo/auth";
import { account } from "@repo/db";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const authRouter = router({
  hasPassword: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, ctx.session.user.id),
          eq(account.providerId, "credential"),
        ),
      );
    return { hasPassword: !!row?.password };
  }),

  setPassword: protectedProcedure
    .input(z.object({ newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await auth.api.setPassword({
          body: { newPassword: input.newPassword },
          headers: ctx.headers,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Nie udało się ustawić hasła";
        throw new TRPCError({ code: "BAD_REQUEST", message });
      }
      return { success: true };
    }),
});
