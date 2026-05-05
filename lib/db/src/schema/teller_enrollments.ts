import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tellerEnrollmentsTable = pgTable("teller_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  enrollmentId: text("enrollment_id").notNull(),
  accessToken: text("access_token").notNull(),
  institutionName: text("institution_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTellerEnrollmentSchema = createInsertSchema(tellerEnrollmentsTable).omit({ id: true, createdAt: true });
export type InsertTellerEnrollment = z.infer<typeof insertTellerEnrollmentSchema>;
export type TellerEnrollment = typeof tellerEnrollmentsTable.$inferSelect;
