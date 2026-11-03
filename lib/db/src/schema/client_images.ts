import { pgTable, serial, integer, text, timestamp, customType } from "drizzle-orm/pg-core";
const binary = customType<{data: Buffer;driverData:Buffer}>({dataType:()=> "bytea"});
export const clientImagesTable = pgTable("client_images", {
 id: serial("id").primaryKey(), ownerId: integer("owner_id").notNull().references(()=>usersTable.id),
 serviceRequestId: integer("service_request_id"), kind: text("kind").notNull(),
 mimeType: text("mime_type").notNull(), data: binary("data").notNull(),
 createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});
import { usersTable } from "./users";
