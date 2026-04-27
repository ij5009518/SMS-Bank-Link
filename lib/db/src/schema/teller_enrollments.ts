import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tellerEnrollmentsTable = pgTable("teller_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  enrollmentId: text("enrollment_id").notNull(),
  accessToken: text("access_token").notNull(),
  accessTokenCiphertext: text("access_token_ciphertext"),
  accessTokenCiphertextIv: text("access_token_ciphertext_iv"),
  accessTokenCiphertextTag: text("access_token_ciphertext_tag"),
  accessTokenWrappedDek: text("access_token_wrapped_dek"),
  accessTokenWrappedDekIv: text("access_token_wrapped_dek_iv"),
  accessTokenWrappedDekTag: text("access_token_wrapped_dek_tag"),
  institutionName: text("institution_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTellerEnrollmentSchema = createInsertSchema(tellerEnrollmentsTable).omit({ id: true, createdAt: true });
export type InsertTellerEnrollment = z.infer<typeof insertTellerEnrollmentSchema>;
export type TellerEnrollment = typeof tellerEnrollmentsTable.$inferSelect;
