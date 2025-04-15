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

type TokenDetails = {
  symbol: string;
  name: string;
  decimals: number;
};

type NetworkTokens = {
  [tokenAddress: string]: TokenDetails;
};

type TestnetTokenMap = {
  [chainId: string]: NetworkTokens;
};

// Testnet token addresses (add more as needed)
export const TESTNET_TOKENS: TestnetTokenMap = {
  // Goerli testnet tokens
  "0x5": {
    // Goerli TestUSDC
    "0x07865c6e87b9f70255377e024ace6630c1eaa37f": {
      symbol: "USDC",
      name: "USD Coin (Goerli)",
      decimals: 6,
    },
    // Goerli TestDAI 
    "0x11fe4b6ae13d2a6055c8d9cf65c55bac32b5d844": {
      symbol: "DAI",
      name: "Dai Stablecoin (Goerli)",
      decimals: 18,
    },
    // Goerli Test LINK
    "0x326c977e6efc84e512bb9c30f76e30c160ed06fb": {
      symbol: "LINK",
      name: "ChainLink Token (Goerli)",
      decimals: 18,
    },
  },
  // Mumbai testnet tokens (Polygon)
  "0x13881": {
    // Mumbai TestUSDC
    "0xe11a86849d99f524cac3e7a0ec1241828e332c62": {
      symbol: "USDC",
      name: "USD Coin (Mumbai)",
      decimals: 6,
    },
    // Mumbai TestDAI
    "0xd393b1e02da9831ff419e22ea105aae4c47e1253": {
      symbol: "DAI",
      name: "Dai Stablecoin (Mumbai)", 
      decimals: 18,
    },
    // Mumbai Test WMATIC
    "0x9c3c9283d3e44854697cd22d3faa240cfb032889": {
      symbol: "WMATIC",
      name: "Wrapped Matic (Mumbai)",
      decimals: 18,
    },
  },
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
      
      // Load supported tokens for current network
      await this.loadSupportedTokens();
      
      return accounts[0];
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
      throw error;
    }
  }
  
  // Load supported tokens based on current network
  private async loadSupportedTokens(): Promise<void> {
    if (!this.provider) return;
    
    try {
      const network = await this.provider.getNetwork();
      const chainId = `0x${network.chainId.toString(16)}`;
      
      this.supportedTokens = [];
      
      // Type guard to check if the chainId exists in TESTNET_TOKENS
      if (chainId in TESTNET_TOKENS) {
        // Type assertion to help TypeScript understand the indexing
        const networkTokens = TESTNET_TOKENS[chainId as keyof typeof TESTNET_TOKENS];
        
        // Convert token map to array of token info objects
        for (const address in networkTokens) {
          const token = networkTokens[address as keyof typeof networkTokens];
          this.supportedTokens.push({
            address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals
          });
        }
      }
      
      console.log(`Loaded ${this.supportedTokens.length} tokens for network ${network.name} (${chainId})`);
    } catch (error) {
      console.error("Failed to load supported tokens:", error);
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

  // Get all supported tokens for the current network
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
  
  // Get a specific token balance
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
  
  // Get the balance of the currently selected token or native token
  async getBalance(): Promise<TokenBalance | null> {
    if (this.tokenAddress) {
      return this.getTokenBalance(this.tokenAddress);
    } else {
      return this.getNativeBalance();
    }
  }
  
  // Get balances for all supported tokens
  async getAllTokenBalances(): Promise<TokenBalance[]> {
    if (!this.provider || !this.signer || this.supportedTokens.length === 0) {
      return [];
    }
    
    const balances: TokenBalance[] = [];
    
    // Add native token balance first
    const nativeBalance = await this.getNativeBalance();
    if (nativeBalance) balances.push(nativeBalance);
    
    // Add all token balances
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
    
    // Check if we have a token address selected
    if (!this.tokenAddress || !this.erc20Contract) {
      throw new Error("No token selected. Please select a token for the deduction.");
    }
    
    try {
      // Step 1: Get token decimals to format the amount correctly
      const tokenInfo = this.supportedTokens.find(t => t.address.toLowerCase() === this.tokenAddress?.toLowerCase());
      const decimals = tokenInfo?.decimals || 18;
      
      // Step 2: Convert amount to token units based on decimals
      const amountInTokenUnits = ethers.utils.parseUnits(amount, decimals);
      
      // Step 3: First, approve the deduction contract to spend tokens
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
        this.tokenAddress,         // The token address to use
        amountInTokenUnits,        // The amount in token units
        intervalInDays * 86400,    // Interval in seconds
        durationDays * 86400,      // Duration in seconds
        startDateTimestamp         // Start timestamp
      );
      
      await tx.wait();
      return tx.hash;
      */
      
      // For demo purposes, generate a mock transaction hash
      console.log(`Scheduling deduction of ${amount} ${tokenInfo?.symbol || 'tokens'} every ${intervalInDays} days`);
      
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
