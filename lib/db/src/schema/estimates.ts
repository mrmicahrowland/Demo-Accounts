import { pgTable, text, serial, timestamp, integer, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const estimateStatusEnum = pgEnum("estimate_status", ["pending", "reviewed", "approved", "rejected", "converted"]);
export const gateTypeEnum = pgEnum("gate_type", ["single_gate", "dual_gate", "sliding_gate", "commercial", "access_control", "intercom", "repair", "maintenance", "new_installation"]);

export const estimatesTable = pgTable("estimates", {
  id: serial("id").primaryKey(),
  estimateNumber: text("estimate_number").notNull().unique(),
  clientId: integer("client_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: estimateStatusEnum("status").notNull().default("pending"),
  gateType: gateTypeEnum("gate_type").notNull(),
  propertyAddress: text("property_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  description: text("description"),
  siteVisitFee: numeric("site_visit_fee", { precision: 10, scale: 2 }).notNull().default("150.00"),
  estimateAmount: numeric("estimate_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  imageUrls: text("image_urls").array().notNull().default([]),
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEstimateSchema = createInsertSchema(estimatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimatesTable.$inferSelect;
