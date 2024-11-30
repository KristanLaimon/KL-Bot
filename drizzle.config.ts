import { Config, defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "sqlite",
  schema: "./drizzle/schema.ts",
  dbCredentials: {
    url: "file:./db/klbotdb.db"
  }
}) satisfies Config;