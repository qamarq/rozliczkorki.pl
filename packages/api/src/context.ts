import { auth } from "@repo/auth";
import { db } from "@repo/db";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({ headers: opts.headers });

  return {
    db,
    session,
    headers: opts.headers,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
