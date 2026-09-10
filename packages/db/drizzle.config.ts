import { defineConfig } from "drizzle-kit";

// Migrations run DDL, so prefer Neon's direct (unpooled) connection when
// available — pooled/PgBouncer connections can be unreliable for schema
// changes. The Neon Vercel integration sets DATABASE_URL_UNPOOLED for you.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
});
