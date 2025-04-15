import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import web3Service, { Network, TokenBalance, TokenInfo } from '@/lib/web3';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: Network | null;
  balance: TokenBalance | null;
  error: string | null;
  supportedTokens: TokenInfo[];
  selectedToken: string | null;
  tokenBalances: TokenBalance[];
  isLoadingTokens: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectToken: (tokenAddress: string) => void;
  refreshTokenBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  balance: null,
  error: null,
  supportedTokens: [],
  selectedToken: null,
  tokenBalances: [],
  isLoadingTokens: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  selectToken: () => {},
  refreshTokenBalances: async () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Load all token balances
  const refreshTokenBalances = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoadingTokens(true);
    try {
      // Get supported tokens
      const tokens = web3Service.getSupportedTokens();
      setSupportedTokens(tokens);
      
      // Get token balances
      const balances = await web3Service.getAllTokenBalances();
      setTokenBalances(balances);
      
      // If no token is selected yet but we have tokens with balance, select the first one
      if (!selectedToken && balances.length > 0) {
        // Find first token with non-zero balance and an address (not the native token)
        const tokenWithBalance = balances.find(t => 
          t.address && parseFloat(t.balance) > 0
        );
        
        if (tokenWithBalance?.address) {
          selectToken(tokenWithBalance.address);
        } else if (balances[0].address) {
          // Fallback to first token if none have balance
          selectToken(balances[0].address);
        }
      }
    } catch (error) {
      console.error("Failed to load token balances:", error);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [isConnected, selectedToken]);
  
  // Select a token for deductions
  const selectToken = useCallback((tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    web3Service.setTokenAddress(tokenAddress);
    
    // Update current balance to show the selected token's balance
    const tokenBalance = tokenBalances.find(t => t.address === tokenAddress);
    if (tokenBalance) {
      setBalance(tokenBalance);
    }
  }, [tokenBalances]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletAddress = await web3Service.connect();
      if (walletAddress) {
        setAddress(walletAddress);
        setIsConnected(true);
        
        // Get network and balance
        const network = await web3Service.getNetwork();
        setNetwork(network);
        
        // Load tokens and balances
        const tokens = web3Service.getSupportedTokens();
        setSupportedTokens(tokens);
        
        // Get all token balances
        await refreshTokenBalances();
      } else {
        setError('Failed to connect to wallet');
      }
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [refreshTokenBalances]);

  const disconnectWallet = useCallback(() => {
    web3Service.disconnect();
    setIsConnected(false);
    setAddress(null);
    setNetwork(null);
    setBalance(null);
    setSelectedToken(null);
    setTokenBalances([]);
    setSupportedTokens([]);
  }, []);

  // Setup event listeners for wallet changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== address && isConnected) {
        setAddress(accounts[0]);
        const balance = await web3Service.getBalance();
        setBalance(balance);
      }
    };

    const handleChainChanged = async () => {
      const network = await web3Service.getNetwork();
      setNetwork(network);
      const balance = await web3Service.getBalance();
      setBalance(balance);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address, isConnected, disconnectWallet]);

  // Refresh balance periodically when connected
  useEffect(() => {
    if (!isConnected) return;
    
    const refreshBalance = async () => {
      const balance = await web3Service.getBalance();
      setBalance(balance);
    };
    
    const intervalId = setInterval(refreshBalance, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [isConnected]);

  const value = {
    isConnected,
    isConnecting,
    address,
    network,
    balance,
    error,
    supportedTokens,
    selectedToken,
    tokenBalances,
    isLoadingTokens,
    connectWallet,
    disconnectWallet,
    selectToken,
    refreshTokenBalances
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
