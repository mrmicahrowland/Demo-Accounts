import { pgTable, text, serial, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  city: text("city"),
  state: text("state"),
  imageUrls: text("image_urls").array().notNull().default([]),
  beforeImageUrl: text("before_image_url"),
  afterImageUrl: text("after_image_url"),
  brands: text("brands").array().notNull().default([]),
  completedDate: text("completed_date"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPortfolioSchema = createInsertSchema(portfolioTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolioTable.$inferSelect;
