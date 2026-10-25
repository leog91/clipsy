import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/index";
import { readSummary } from "../../../apps/web/src/lib/summary";

test("summary is owner-scoped, excludes deleted records, and handles empty/deleted accounts", async () => {
  const client = createClient({ url: "file::memory:" });
  const db = drizzle(client, { schema });
  try {
    await client.executeMultiple(`
      CREATE TABLE user (id TEXT PRIMARY KEY, deleted_at INTEGER);
      CREATE TABLE items (id TEXT PRIMARY KEY, user_id TEXT, source TEXT, status TEXT, deleted_at INTEGER);
      CREATE TABLE collections (id TEXT PRIMARY KEY, user_id TEXT, deleted_at INTEGER);
      CREATE TABLE channels (id TEXT PRIMARY KEY, deleted_at INTEGER);
      CREATE TABLE subscriptions (id TEXT PRIMARY KEY, user_id TEXT, channel_id TEXT, deleted_at INTEGER);
      INSERT INTO user VALUES ('alice', NULL), ('bob', NULL), ('empty', NULL), ('deleted', 1);
      INSERT INTO items VALUES ('a', 'alice', 'youtube', 'to_watch', NULL), ('b', 'alice', 'youtube', 'watching', NULL), ('c', 'alice', 'youtube', 'to_watch', 1), ('d', 'bob', 'youtube', 'watching', NULL), ('e', 'alice', 'other', 'to_watch', NULL);
      INSERT INTO collections VALUES ('a', 'alice', NULL), ('b', 'alice', 1), ('c', 'bob', NULL);
      INSERT INTO channels VALUES ('active', NULL), ('deleted', 1);
      INSERT INTO subscriptions VALUES ('a', 'alice', 'active', NULL), ('b', 'alice', 'deleted', NULL), ('c', 'alice', 'active', 1), ('d', 'bob', 'active', NULL);
    `);
    assert.deepEqual(await readSummary("alice", db), {
      videos: 2,
      toWatch: 1,
      watching: 1,
      collections: 1,
      subscriptions: 1,
    });
    assert.deepEqual(await readSummary("empty", db), {
      videos: 0,
      toWatch: 0,
      watching: 0,
      collections: 0,
      subscriptions: 0,
    });
    assert.equal(await readSummary("deleted", db), null);
    assert.equal(await readSummary("missing", db), null);
  } finally {
    client.close();
  }
});
