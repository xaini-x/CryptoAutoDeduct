import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import web3Service, { TokenInfo, TokenBalance } from '@/lib/web3';
import { Loader2 } from 'lucide-react';

export default function TokenSelect() {
  const { isConnected, address } = useWallet();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load supported tokens whenever wallet is connected
  useEffect(() => {
    if (!isConnected) return;
    
    // Get supported tokens for the current network
    const supportedTokens = web3Service.getSupportedTokens();
    setTokens(supportedTokens);
    
    // If we have tokens, load their balances
    if (supportedTokens.length > 0) {
      loadTokenBalances();
    }
  }, [isConnected, address]);
  
  // Load balances for all tokens
  const loadTokenBalances = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const balances = await web3Service.getAllTokenBalances();
      setTokenBalances(balances);
      
      // Automatically select the first token with positive balance
      const tokenWithBalance = balances.find(t => 
        t.address && parseFloat(t.balance) > 0
      );
      
      if (tokenWithBalance?.address && !selectedToken) {
        handleTokenSelect(tokenWithBalance.address);
      }
    } catch (error) {
      console.error('Failed to load token balances:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle token selection
  const handleTokenSelect = (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    web3Service.setTokenAddress(tokenAddress);
  };
  
  // Show native token balance (ETH or MATIC)
  const nativeBalance = tokenBalances.find(t => !t.address);
  
  // Filter out tokens with balance (to display at the top)
  const tokensWithBalance = tokenBalances.filter(t => 
    t.address && parseFloat(t.balance) > 0
  );
  
  // Other tokens (with zero balance)
  const zeroBalanceTokens = tokenBalances.filter(t => 
    t.address && parseFloat(t.balance) === 0
  );

  if (!isConnected) {
    return (
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-gray-400">Connect your wallet to select tokens</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Loading tokens...</p>
      </div>
    );
  }
  
  if (tokens.length === 0) {
    return (
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-gray-400">No testnet tokens available on this network</p>
        <p className="text-sm text-gray-500 mt-1">Switch to Goerli or Mumbai testnet</p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Select Token for Deduction</h3>
      
      {/* Native token balance (ETH/MATIC) */}
      {nativeBalance && (
        <div className="mb-2">
          <p className="text-sm text-gray-400">
            Native Balance: {parseFloat(nativeBalance.balance).toFixed(4)} {nativeBalance.symbol}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {/* Tokens with balance */}
        {tokensWithBalance.map((token) => (
          <button
            key={token.address}
            onClick={() => token.address && handleTokenSelect(token.address)}
            className={`p-2 rounded-md flex flex-col items-center justify-center text-center transition-colors ${
              selectedToken === token.address
                ? 'bg-primary/20 border border-primary'
                : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
            }`}
          >
            <span className="font-medium">{token.symbol}</span>
            <span className="text-xs text-gray-300">
              {parseFloat(token.balance).toFixed(token.decimals > 8 ? 4 : 2)}
            </span>
          </button>
        ))}
        
        {/* Zero balance tokens */}
        {zeroBalanceTokens.map((token) => (
          <button
            key={token.address}
            onClick={() => token.address && handleTokenSelect(token.address)}
            className={`p-2 rounded-md flex flex-col items-center justify-center text-center opacity-70 transition-colors ${
              selectedToken === token.address
                ? 'bg-primary/20 border border-primary'
                : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
            }`}
          >
            <span className="font-medium">{token.symbol}</span>
            <span className="text-xs text-gray-300">0.00</span>
          </button>
        ))}
      </div>
      
      {selectedToken && (
        <div className="mt-2 p-2 bg-gray-700 rounded-md">
          <p className="text-sm">
            Selected: <span className="font-medium">
              {tokenBalances.find(t => t.address === selectedToken)?.symbol || 'Unknown Token'}
            </span>
          </p>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        Note: You need testnet tokens to schedule deductions. Use a faucet to get testnet tokens.
      </p>
    </div>
  );
}