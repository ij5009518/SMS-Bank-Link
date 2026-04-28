import { pgTable, serial, integer, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";

export const phoneNumbersTable = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  phoneNumberDigits: text("phone_number_digits").notNull(),
  phoneNumberE164: text("phone_number_e164"),
  label: text("label"),
  verified: boolean("verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  phoneNumbersUserPhoneDigitsUnique: uniqueIndex("phone_numbers_user_phone_digits_unique").on(table.userId, table.phoneNumberDigits),
  phoneNumbersPhoneDigitsIdx: index("phone_numbers_phone_digits_idx").on(table.phoneNumberDigits),
  phoneNumbersPhoneE164Idx: index("phone_numbers_phone_e164_idx").on(table.phoneNumberE164),
  phoneNumbersVerifiedPhoneDigitsIdx: index("phone_numbers_verified_phone_digits_idx").on(table.verified, table.phoneNumberDigits),
}));

export type PhoneNumber = typeof phoneNumbersTable.$inferSelect;
