import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash"),
  smsConsent: boolean("sms_consent").notNull().default(false),
  consentDate: timestamp("consent_date"),
  optedOut: boolean("opted_out").notNull().default(false),
  onboardingStatus: text("onboarding_status").notNull().default("pending"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationCodeHash: text("phone_verification_code_hash"),
  phoneVerificationCodeSalt: text("phone_verification_code_salt"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry"),
  pendingPhoneNumber: text("pending_phone_number"),
  pendingPhoneCode: text("pending_phone_code"),
  pendingPhoneCodeHash: text("pending_phone_code_hash"),
  pendingPhoneCodeSalt: text("pending_phone_code_salt"),
  pendingPhoneExpiry: timestamp("pending_phone_expiry"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token").unique(),
  emailVerificationTokenHash: text("email_verification_token_hash").unique(),
  emailVerificationTokenSalt: text("email_verification_token_salt"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  deviceVerificationCode: text("device_verification_code"),
  deviceVerificationCodeHash: text("device_verification_code_hash"),
  deviceVerificationCodeSalt: text("device_verification_code_salt"),
  deviceVerificationExpiry: timestamp("device_verification_expiry"),
  plan: text("plan").notNull().default("basic"),
  googleId: text("google_id").unique(),
  passwordResetToken: text("password_reset_token").unique(),
  passwordResetTokenHash: text("password_reset_token_hash").unique(),
  passwordResetTokenSalt: text("password_reset_token_salt"),
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"),
  passwordResetOtp: text("password_reset_otp"),
  passwordResetOtpHash: text("password_reset_otp_hash"),
  passwordResetOtpSalt: text("password_reset_otp_salt"),
  passwordResetOtpExpiry: timestamp("password_reset_otp_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
