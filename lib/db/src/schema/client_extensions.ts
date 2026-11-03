import { pgTable, serial, integer, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const clientAddressesTable = pgTable("client_addresses", {
 id: serial("id").primaryKey(), clientId: integer("client_id").notNull(),
 label: text("label").notNull().default("Service address"),
 address: text("address").notNull(), city: text("city").notNull(),
 state: text("state").notNull(), zip: text("zip").notNull(),
 isDefault: boolean("is_default").notNull().default(false),
 createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const termsVersionsTable = pgTable("terms_versions", {
 id: serial("id").primaryKey(), version: text("version").notNull().unique(),
 content: text("content").notNull(), active: boolean("active").notNull().default(false),
 createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
export const termsAcceptancesTable = pgTable("terms_acceptances", {
 id: serial("id").primaryKey(), userId: integer("user_id").notNull(),
 termsVersionId: integer("terms_version_id").notNull(),
 acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow()
}, t => [uniqueIndex("terms_acceptance_unique").on(t.userId, t.termsVersionId)]);
export const emailChangeRequestsTable = pgTable("email_change_requests", {
 id: serial("id").primaryKey(), userId: integer("user_id").notNull(),
 newEmail: text("new_email").notNull(), tokenHash: text("token_hash").notNull().unique(),
 expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
 usedAt: timestamp("used_at", { withTimezone: true })
});
export const guestServiceRequestsTable = pgTable("guest_service_requests", {
 id: serial("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull(),
 phone: text("phone"), type: text("type").notNull(), description: text("description").notNull(),
 serviceAddress: text("service_address").notNull(), city: text("city").notNull(),
 state: text("state").notNull(), zip: text("zip").notNull(),
 status: text("status").notNull().default("submitted"),
 createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
