import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const queryClient = postgres(process.env.DATABASE_URL, {
  max: process.env.NODE_ENV === "production" ? 5 : 10,
});

export const db = drizzle(queryClient, { schema });
export * from "./schema";
