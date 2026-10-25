import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const summaryCode = sqliteTable("summary_code", {
  codeHash: text("code_hash").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  redirectUri: text("redirect_uri").notNull(),
  challenge: text("challenge").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
export const summaryAccess = sqliteTable(
  "summary_access",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientOrigin: text("client_origin").notNull(),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("summary_access_user_idx").on(table.userId)],
);
