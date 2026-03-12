import { pgTable, text, serial, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertSettingsTable = pgTable("alert_settings", {
  id: serial("id").primaryKey(),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  weekendPauseEnabled: boolean("weekend_pause_enabled").notNull().default(true),
  weekendPauseStart: text("weekend_pause_start").notNull().default("friday_14:00"),
  weekendPauseEnd: text("weekend_pause_end").notNull().default("sunday_00:00"),
  maxDailyAlerts: integer("max_daily_alerts").notNull().default(10),
  lowBalanceThreshold: numeric("low_balance_threshold", { precision: 10, scale: 2 }).notNull().default("100"),
  largeTransactionThreshold: numeric("large_transaction_threshold", { precision: 10, scale: 2 }).notNull().default("500"),
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettingsTable).omit({ id: true });
export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;
export type AlertSettings = typeof alertSettingsTable.$inferSelect;
