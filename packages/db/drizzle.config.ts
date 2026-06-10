import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
