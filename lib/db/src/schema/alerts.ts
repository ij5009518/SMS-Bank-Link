import { pgTable, text, serial, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(),
  threshold: numeric("threshold", { precision: 12, scale: 2 }),
  channel: text("channel").notNull().default("sms"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Alert = typeof alertsTable.$inferSelect;
