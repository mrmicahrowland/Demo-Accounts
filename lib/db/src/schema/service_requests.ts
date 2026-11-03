import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const serviceRequestTypeEnum = pgEnum("service_request_type", ["installation", "repair", "upgrade", "maintenance", "emergency"]);
export const serviceRequestStatusEnum = pgEnum("service_request_status", ["submitted", "reviewing", "quoted", "scheduled", "closed", "cancelled"]);

export const serviceRequestsTable = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  type: serviceRequestTypeEnum("type").notNull(),
  status: serviceRequestStatusEnum("status").notNull().default("submitted"),
  description: text("description").notNull(),
  serviceAddress: text("service_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  gateMaterial: text("gate_material"),
  gateConfiguration: text("gate_configuration"),
  gateLengthFeet: text("gate_length_feet"),
  gateHeightFeet: text("gate_height_feet"),
  existingOperator: text("existing_operator"),
  imageUrls: text("image_urls").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
