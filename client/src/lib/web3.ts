import { ethers } from "ethers";

// ERC-20 ABI for token interaction (basic functionality for approvals)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Mock Contract ABI for deductions (in a real app this would be replaced with the actual ABI)
const DEDUCTION_CONTRACT_ABI = [
  "function scheduleDeduction(uint256 amount, uint256 interval, uint256 duration, uint256 startDate) returns (uint256)",
  "function cancelDeduction(uint256 deductionId) returns (bool)",
];

// Default contract address (would be replaced with actual contract address)
const DEDUCTION_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export type Network = {
  name: string;
  chainId: number;
};

export type TokenBalance = {
  symbol: string;
  balance: string;
  balanceRaw: ethers.BigNumber;
  decimals: number;
  usdValue?: string;
};

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private deductionContract: ethers.Contract | null = null;
  private erc20Contract: ethers.Contract | null = null;
  private tokenAddress: string | null = null;

  // Initialize provider with MetaMask
  async connect(): Promise<string | null> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await this.provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) return null;
      
      this.signer = this.provider.getSigner();
      
      // Initialize deduction contract
      this.deductionContract = new ethers.Contract(
        DEDUCTION_CONTRACT_ADDRESS, 
        DEDUCTION_CONTRACT_ABI, 
        this.signer
      );
      
      return accounts[0];
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.deductionContract = null;
    this.erc20Contract = null;
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }

  async getNetwork(): Promise<Network | null> {
    if (!this.provider) return null;
    
    const network = await this.provider.getNetwork();
    return {
      name: network.name,
      chainId: network.chainId,
    };
  }

  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    
    try {
      return await this.signer.getAddress();
    } catch (error) {
      console.error("Failed to get address:", error);
      return null;
    }
  }

  async getBalance(): Promise<TokenBalance | null> {
    if (!this.provider || !this.signer) return null;
    
    try {
      const address = await this.signer.getAddress();
      
      // Get ETH balance
      const balanceRaw = await this.provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balanceRaw);
      
      // Mock USD price for ETH ($2,000)
      const ethUsdPrice = 2000;
      const balanceUsd = (parseFloat(ethBalance) * ethUsdPrice).toFixed(2);
      
      return {
        symbol: "ETH",
        balance: ethBalance,
        balanceRaw,
        decimals: 18,
        usdValue: balanceUsd,
      };
    } catch (error) {
      console.error("Failed to get balance:", error);
      return null;
    }
  }

  async scheduleDeduction(
    amount: string, 
    intervalInDays: number, 
    durationInMonths: number | "indefinite", 
    startDateTimestamp: number
  ): Promise<string> {
    if (!this.deductionContract || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Convert amount to Wei
      const amountWei = ethers.utils.parseEther(amount);
      
      // Convert duration to days (or max value for indefinite)
      const durationDays = durationInMonths === "indefinite" 
        ? 365 * 10 // 10 years as "indefinite" 
        : durationInMonths * 30; // approximate days in a month
      
      // In a real implementation, this would call the actual contract function
      // For this example, we'll simulate a successful transaction
      
      // This would be the actual contract call in production:
      /*
      const tx = await this.deductionContract.scheduleDeduction(
        amountWei,
        intervalInDays * 86400, // seconds in a day
        durationDays * 86400, // seconds in duration
        startDateTimestamp
      );
      
      await tx.wait();
      return tx.hash;
      */
      
      // For demo purposes, generate a mock transaction hash
      return "0x" + Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    } catch (error) {
      console.error("Failed to schedule deduction:", error);
      throw error;
    }
  }

  async cancelDeduction(deductionId: number): Promise<boolean> {
    if (!this.deductionContract || !this.signer) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // In a real implementation, this would call the actual contract function
      // For this example, we'll simulate a successful cancellation
      
      /*
      const tx = await this.deductionContract.cancelDeduction(deductionId);
      await tx.wait();
      return true;
      */
      
      return true;
    } catch (error) {
      console.error("Failed to cancel deduction:", error);
      throw error;
    }
  }
}

// Create a singleton instance
const web3Service = new Web3Service();
export default web3Service;
