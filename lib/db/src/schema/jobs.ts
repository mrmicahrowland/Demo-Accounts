import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobStatusEnum = pgEnum("job_status", ["scheduled", "in_progress", "paused", "completed", "cancelled"]);
export const jobPriorityEnum = pgEnum("job_priority", ["low", "medium", "high", "urgent"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: jobStatusEnum("status").notNull().default("scheduled"),
  priority: jobPriorityEnum("priority").notNull().default("medium"),
  clientId: integer("client_id"),
  assignedToId: integer("assigned_to_id"),
  invoiceId: integer("invoice_id"),
  estimateId: integer("estimate_id"),
  propertyAddress: text("property_address"),
  city: text("city"),
  state: text("state"),
  scheduledDate: text("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  gateType: text("gate_type"),
  notes: text("notes"),
  photoUrls: text("photo_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
