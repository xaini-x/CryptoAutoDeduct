import { ethers } from "ethers";

// ERC-20 ABI for token interaction (basic functionality for approvals)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Mock Contract ABI for deductions (in a real app this would be replaced with the actual ABI)
const DEDUCTION_CONTRACT_ABI = [
  "function scheduleDeduction(address tokenAddress, uint256 amount, uint256 interval, uint256 duration, uint256 startDate) returns (uint256)",
  "function cancelDeduction(uint256 deductionId) returns (bool)",
];

// Default contract address (would be replaced with actual contract address on testnet)
const DEDUCTION_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// Hardcoded USDT token addresses for different networks
const USDT_ADDRESSES = {
  // Goerli testnet
  "0x5": "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49",
  // Mumbai testnet
  "0x13881": "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832",
  // Default for other networks
  "default": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

// USDT token details
const USDT_TOKEN_DETAILS = {
  symbol: "USDT",
  name: "Tether USD",
  decimals: 6
};

export type Network = {
  name: string;
  chainId: number;
};

export type TokenBalance = {
  symbol: string;
  name?: string;
  balance: string;
  balanceRaw: ethers.BigNumber;
  decimals: number;
  address?: string;
  usdValue?: string;
};

export type TokenInfo = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private deductionContract: ethers.Contract | null = null;
  private erc20Contract: ethers.Contract | null = null;
  private tokenAddress: string | null = null;
  private supportedTokens: TokenInfo[] = [];

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
      
      // Load USDT token for current network
      await this.loadUsdtToken();
      
      return accounts[0];
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
      throw error;
    }
  }
  
  // Load USDT token for the current network
  private async loadUsdtToken(): Promise<void> {
    if (!this.provider) return;
    
    try {
      const network = await this.provider.getNetwork();
      const chainId = `0x${network.chainId.toString(16)}`;
      
      // Clear existing tokens
      this.supportedTokens = [];
      
      // Get USDT address for current network or use default
      let usdtAddress = USDT_ADDRESSES[chainId as keyof typeof USDT_ADDRESSES] || USDT_ADDRESSES.default;
      
      // Add USDT token
      this.supportedTokens.push({
        address: usdtAddress,
        symbol: USDT_TOKEN_DETAILS.symbol,
        name: USDT_TOKEN_DETAILS.name,
        decimals: USDT_TOKEN_DETAILS.decimals
      });
      
      // Automatically set USDT as the selected token
      this.setTokenAddress(usdtAddress);
      
      console.log(`Set up USDT token (${usdtAddress}) for network ${network.name} (${chainId})`);
    } catch (error) {
      console.error("Failed to load USDT token:", error);
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.deductionContract = null;
    this.erc20Contract = null;
    this.tokenAddress = null;
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

  // Get the USDT token info
  getSupportedTokens(): TokenInfo[] {
    return this.supportedTokens;
  }
  
  // Set the token address to use for deductions
  setTokenAddress(tokenAddress: string): void {
    this.tokenAddress = tokenAddress;
    
    // Initialize the ERC20 contract with the token address
    if (this.signer && tokenAddress) {
      this.erc20Contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.signer
      );
    }
  }
  
  // Get the balance of the native token (ETH/MATIC)
  async getNativeBalance(): Promise<TokenBalance | null> {
    if (!this.provider || !this.signer) return null;
    
    try {
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      
      // Get ETH/native balance
      const balanceRaw = await this.provider.getBalance(address);
      const ethBalance = ethers.utils.formatEther(balanceRaw);
      
      let symbol = "ETH";
      if (network.name === "matic" || network.name === "maticmum") {
        symbol = "MATIC";
      }
      
      return {
        symbol,
        name: symbol,
        balance: ethBalance,
        balanceRaw,
        decimals: 18,
      };
    } catch (error) {
      console.error("Failed to get native balance:", error);
      return null;
    }
  }
  
  // Get USDT token balance
  async getTokenBalance(tokenAddress: string): Promise<TokenBalance | null> {
    if (!this.provider || !this.signer) return null;
    
    try {
      const userAddress = await this.signer.getAddress();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();
      const name = await contract.name();
      const balanceRaw = await contract.balanceOf(userAddress);
      
      // Format the balance with proper decimals
      const balance = ethers.utils.formatUnits(balanceRaw, decimals);
      
      return {
        symbol,
        name,
        balance,
        balanceRaw,
        decimals,
        address: tokenAddress,
      };
    } catch (error) {
      console.error(`Failed to get token balance for ${tokenAddress}:`, error);
      return null;
    }
  }
  
  // Get the USDT token balance
  async getBalance(): Promise<TokenBalance | null> {
    if (this.tokenAddress) {
      return this.getTokenBalance(this.tokenAddress);
    } else {
      // Fallback to native token balance if no token address set
      return this.getNativeBalance();
    }
  }
  
  // Get balances for native token and USDT
  async getAllTokenBalances(): Promise<TokenBalance[]> {
    if (!this.provider || !this.signer || this.supportedTokens.length === 0) {
      return [];
    }
    
    const balances: TokenBalance[] = [];
    
    // Add native token balance first
    const nativeBalance = await this.getNativeBalance();
    if (nativeBalance) balances.push(nativeBalance);
    
    // Add USDT balance
    for (const token of this.supportedTokens) {
      try {
        const balance = await this.getTokenBalance(token.address);
        if (balance) balances.push(balance);
      } catch (error) {
        console.error(`Failed to get balance for ${token.symbol}:`, error);
      }
    }
    
    return balances;
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
    
    // Check if we have USDT token address
    if (!this.tokenAddress || !this.erc20Contract) {
      throw new Error("USDT token not set up properly");
    }
    
    try {
      // Step 1: Get USDT token decimals (should be 6)
      const tokenInfo = this.supportedTokens[0];
      const decimals = tokenInfo?.decimals || 6;
      
      // Step 2: Convert amount to USDT units (6 decimals)
      const amountInTokenUnits = ethers.utils.parseUnits(amount, decimals);
      
      // Step 3: First, approve the deduction contract to spend USDT
      /*
      const approvalTx = await this.erc20Contract.approve(
        DEDUCTION_CONTRACT_ADDRESS, 
        amountInTokenUnits
      );
      await approvalTx.wait();
      */
      
      // Step 4: Convert duration to days (or max value for indefinite)
      const durationDays = durationInMonths === "indefinite" 
        ? 365 * 10 // 10 years as "indefinite" 
        : durationInMonths * 30; // approximate days in a month
      
      // Step 5: Schedule the deduction
      /*
      const tx = await this.deductionContract.scheduleDeduction(
        this.tokenAddress,         // The USDT token address
        amountInTokenUnits,        // The amount in USDT units
        intervalInDays * 86400,    // Interval in seconds
        durationDays * 86400,      // Duration in seconds
        startDateTimestamp         // Start timestamp
      );
      
      await tx.wait();
      return tx.hash;
      */
      
      // For demo purposes, generate a mock transaction hash
      console.log(`Scheduling deduction of ${amount} USDT every ${intervalInDays} days`);
      
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