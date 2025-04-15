import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScheduledDeductionSchema, insertTransactionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Get all scheduled deductions for a wallet address
  apiRouter.get("/deductions/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const deductions = await storage.getScheduledDeductions(walletAddress);
      return res.json(deductions);
    } catch (error) {
      console.error("Error fetching deductions:", error);
      return res.status(500).json({ message: "Failed to fetch deductions" });
    }
  });

  // Create a new scheduled deduction
  apiRouter.post("/deductions", async (req: Request, res: Response) => {
    try {
      const deductionData = insertScheduledDeductionSchema.parse(req.body);
      const newDeduction = await storage.createScheduledDeduction(deductionData);
      return res.status(201).json(newDeduction);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating deduction:", error);
      return res.status(500).json({ message: "Failed to create deduction" });
    }
  });

  // Update a scheduled deduction
  apiRouter.patch("/deductions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deduction ID" });
      }

      const existingDeduction = await storage.getScheduledDeduction(id);
      if (!existingDeduction) {
        return res.status(404).json({ message: "Deduction not found" });
      }

      const updatedDeduction = await storage.updateScheduledDeduction(id, req.body);
      return res.json(updatedDeduction);
    } catch (error) {
      console.error("Error updating deduction:", error);
      return res.status(500).json({ message: "Failed to update deduction" });
    }
  });

  // Delete a scheduled deduction
  apiRouter.delete("/deductions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deduction ID" });
      }

      const existingDeduction = await storage.getScheduledDeduction(id);
      if (!existingDeduction) {
        return res.status(404).json({ message: "Deduction not found" });
      }

      const success = await storage.deleteScheduledDeduction(id);
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete deduction" });
      }
    } catch (error) {
      console.error("Error deleting deduction:", error);
      return res.status(500).json({ message: "Failed to delete deduction" });
    }
  });

  // Get transaction history for a wallet address
  apiRouter.get("/transactions/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const transactions = await storage.getTransactions(walletAddress);
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Record a new transaction
  apiRouter.post("/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const newTransaction = await storage.createTransaction(transactionData);
      return res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating transaction:", error);
      return res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
