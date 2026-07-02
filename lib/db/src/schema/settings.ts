import { pgTable, text, serial, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Automatic Gate & Entryways"),
  companyPhone: text("company_phone").notNull().default("(404) 555-0100"),
  companyEmail: text("company_email").notNull().default("info@automaticgate.com"),
  companyAddress: text("company_address").notNull().default("Atlanta, GA 30301"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  siteVisitFee: numeric("site_visit_fee", { precision: 10, scale: 2 }).notNull().default("150.00"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).notNull().default("0.0800"),
  enableHomepageMap: boolean("enable_homepage_map").notNull().default(true),
  enableAiChat: boolean("enable_ai_chat").notNull().default(true),
  enableNewsletter: boolean("enable_newsletter").notNull().default(true),
  enablePortfolio: boolean("enable_portfolio").notNull().default(true),
  enableBlog: boolean("enable_blog").notNull().default(true),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  businessHours: text("business_hours").default("Mon-Fri 8am-6pm, Sat 9am-4pm"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
