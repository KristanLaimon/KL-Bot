import { Config, defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "sqlite",
  schema: "./src/schema.ts",
  dbCredentials: {
    url: "file:./db/help.db"
  }
}) satisfies Config;