import { appRouter, createTRPCContext } from "@repo/api";
import { headers } from "next/headers";

export async function serverTrpc() {
  const ctx = await createTRPCContext({ headers: await headers() });
  return appRouter.createCaller(ctx);
}
