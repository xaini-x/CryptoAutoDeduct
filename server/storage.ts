import { 
  users, 
  scheduledDeductions, 
  transactions, 
  type User, 
  type InsertUser, 
  type ScheduledDeduction, 
  type InsertScheduledDeduction,
  type Transaction,
  type InsertTransaction
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Scheduled Deductions methods
  getScheduledDeductions(walletAddress: string): Promise<ScheduledDeduction[]>;
  getScheduledDeduction(id: number): Promise<ScheduledDeduction | undefined>;
  createScheduledDeduction(deduction: InsertScheduledDeduction): Promise<ScheduledDeduction>;
  updateScheduledDeduction(id: number, updates: Partial<InsertScheduledDeduction>): Promise<ScheduledDeduction | undefined>;
  deleteScheduledDeduction(id: number): Promise<boolean>;

  // Transactions methods
  getTransactions(walletAddress: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scheduledDeductions: Map<number, ScheduledDeduction>;
  private transactions: Map<number, Transaction>;
  private userId: number;
  private deductionId: number;
  private transactionId: number;

  constructor() {
    this.users = new Map();
    this.scheduledDeductions = new Map();
    this.transactions = new Map();
    this.userId = 1;
    this.deductionId = 1;
    this.transactionId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Scheduled Deductions methods
  async getScheduledDeductions(walletAddress: string): Promise<ScheduledDeduction[]> {
    return Array.from(this.scheduledDeductions.values()).filter(
      deduction => deduction.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async getScheduledDeduction(id: number): Promise<ScheduledDeduction | undefined> {
    return this.scheduledDeductions.get(id);
  }

  async createScheduledDeduction(deduction: InsertScheduledDeduction): Promise<ScheduledDeduction> {
    const id = this.deductionId++;
    const createdAt = new Date();
    const newDeduction: ScheduledDeduction = { 
      ...deduction, 
      id, 
      createdAt,
      status: deduction.status || 'pending' // Ensure status is provided
    };
    this.scheduledDeductions.set(id, newDeduction);
    return newDeduction;
  }

  async updateScheduledDeduction(id: number, updates: Partial<InsertScheduledDeduction>): Promise<ScheduledDeduction | undefined> {
    const deduction = this.scheduledDeductions.get(id);
    if (!deduction) return undefined;

    const updatedDeduction: ScheduledDeduction = { 
      ...deduction, 
      ...updates 
    };
    this.scheduledDeductions.set(id, updatedDeduction);
    return updatedDeduction;
  }

  async deleteScheduledDeduction(id: number): Promise<boolean> {
    return this.scheduledDeductions.delete(id);
  }

  // Transactions methods
  async getTransactions(walletAddress: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletAddress.toLowerCase() === walletAddress.toLowerCase())
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const newTransaction: Transaction = { 
      ...transaction, 
      id,
      date: transaction.date || new Date(),   // Ensure date is provided
      txHash: transaction.txHash || ""        // Ensure txHash is provided
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
}

export const storage = new MemStorage();
