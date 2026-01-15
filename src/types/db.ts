/**
 * Centralized database types from Drizzle schema.
 * These types are auto-generated from schema definitions.
 */

import { users } from "@/db/schema";

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
