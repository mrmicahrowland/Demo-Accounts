import { pgTable, bigserial, integer, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: integer("actor_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  ipAddress: text("ip_address"),
  requestId: text("request_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_created_at_idx").on(table.createdAt),
  index("audit_logs_actor_id_idx").on(table.actorId),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
]);
