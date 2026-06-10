import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof createClient> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function getClient() {
  if (globalForDb.client) return globalForDb.client;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    // Return a dummy client during build time - will throw when actually used
    return createClient({
      url: "libsql://dummy",
    });
  }

  globalForDb.client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return globalForDb.client;
}

export function getDb() {
  if (globalForDb.db) return globalForDb.db;

  const client = getClient();
  globalForDb.db = drizzle(client, { schema });

  return globalForDb.db;
}

export type Database = ReturnType<typeof getDb>;
