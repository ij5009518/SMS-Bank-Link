import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const smsLogsTable = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  phoneNumber: text("phone_number").notNull(),
  direction: text("direction").notNull(),
  message: text("message").notNull(),
  command: text("command"),
  status: text("status").notNull().default("delivered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSmsLogSchema = createInsertSchema(smsLogsTable).omit({ id: true, createdAt: true });
export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogsTable.$inferSelect;
