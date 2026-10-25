import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../../.env") });

// Separate additive migrations: existing core migrations are local/ignored.
export default defineConfig({
  schema: "./src/schema/integrations.ts",
  out: "./drizzle-integrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file::memory:",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
