import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").notNull().default("tag"),
  isSystem: boolean("is_system").notNull().default(false),
  isAi: boolean("is_ai").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Category = typeof categoriesTable.$inferSelect;
