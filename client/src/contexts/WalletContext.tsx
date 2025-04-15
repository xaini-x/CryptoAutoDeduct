import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import web3Service, { Network, TokenBalance } from '@/lib/web3';

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: Network | null;
  balance: TokenBalance | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  balance: null,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
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
        
        const balance = await web3Service.getBalance();
        setBalance(balance);
      } else {
        setError('Failed to connect to wallet');
      }
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    web3Service.disconnect();
    setIsConnected(false);
    setAddress(null);
    setNetwork(null);
    setBalance(null);
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
    connectWallet,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
