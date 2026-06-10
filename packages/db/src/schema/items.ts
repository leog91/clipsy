import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  source: text("source").notNull(),
  sourceId: text("source_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  channel: text("channel"),
  duration: integer("duration"),
  status: text("status", { enum: ["to_watch", "watching"] })
    .notNull()
    .default("to_watch"),
  lastPositionSeconds: integer("last_position_seconds"),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const itemTags = sqliteTable("item_tags", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const collectionItems = sqliteTable("collection_items", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});
