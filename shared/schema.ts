import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const scheduledDeductions = pgTable("scheduled_deductions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  amount: text("amount").notNull(),
  tokenSymbol: text("token_symbol").notNull().default("ETH"),
  tokenAddress: text("token_address").notNull().default(""),
  interval: text("interval").notNull(),
  duration: text("duration").notNull(),
  startDate: timestamp("start_date").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  deductionId: integer("deduction_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  amount: text("amount").notNull(),
  tokenSymbol: text("token_symbol").notNull().default("ETH"),
  tokenAddress: text("token_address").notNull().default(""),
  status: text("status").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  txHash: text("tx_hash").notNull().default(""),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScheduledDeductionSchema = createInsertSchema(scheduledDeductions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScheduledDeduction = z.infer<typeof insertScheduledDeductionSchema>;
export type ScheduledDeduction = typeof scheduledDeductions.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
