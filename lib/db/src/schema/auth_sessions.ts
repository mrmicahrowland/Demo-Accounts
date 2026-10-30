import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const authSessionsTable = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  refreshHash: text("refresh_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
