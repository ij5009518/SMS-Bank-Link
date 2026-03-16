import { pgTable, text, serial, integer, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  tellerAccountId: text("teller_account_id"),
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(),
  accountLastFour: text("account_last_four").notNull(),
  nickname: text("nickname").notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("accounts_user_teller_account_idx").on(t.userId, t.tellerAccountId),
]);

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
