import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";

export const phoneNumbersTable = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  label: text("label"),
  verified: boolean("verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PhoneNumber = typeof phoneNumbersTable.$inferSelect;
