import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import web3Service, { TokenBalance } from '@/lib/web3';
import { Loader2 } from 'lucide-react';

export default function TokenSelect() {
  const { isConnected, address } = useWallet();
  const [usdtBalance, setUsdtBalance] = useState<TokenBalance | null>(null);
  const [nativeBalance, setNativeBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load USDT balance whenever wallet is connected
  useEffect(() => {
    if (!isConnected) return;
    
    loadBalances();
  }, [isConnected, address]);
  
  // Load balances for native token and USDT
  const loadBalances = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Get native token balance (ETH/MATIC)
      const native = await web3Service.getNativeBalance();
      setNativeBalance(native);
      
      // Get USDT balance
      const usdtTokenInfo = web3Service.getSupportedTokens()[0];
      if (usdtTokenInfo?.address) {
        const usdt = await web3Service.getTokenBalance(usdtTokenInfo.address);
        setUsdtBalance(usdt);
      }
    } catch (error) {
      console.error('Failed to load token balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-gray-400">Connect your wallet to see USDT balance</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Loading USDT balance...</p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Token Information</h3>
      
      {/* Native token balance (ETH/MATIC) */}
      {nativeBalance && (
        <div className="mb-3 p-2 bg-gray-700 rounded">
          <p className="text-sm">
            Native Balance: <span className="font-medium">
              {parseFloat(nativeBalance.balance).toFixed(4)} {nativeBalance.symbol}
            </span>
          </p>
        </div>
      )}
      
      {/* USDT balance */}
      <div className={`p-3 rounded-md border ${usdtBalance ? 'bg-primary/10 border-primary' : 'bg-gray-700 border-gray-600'}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-lg">USDT</span>
          <div className="bg-gray-700 px-2 py-1 rounded text-xs">Selected</div>
        </div>
        
        <p className="text-sm">
          Balance: <span className="font-medium">
            {usdtBalance 
              ? parseFloat(usdtBalance.balance).toFixed(2)
              : '0.00'
            } USDT
          </span>
        </p>
        
        {usdtBalance?.address && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            Contract: {usdtBalance.address}
          </p>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Note: You need USDT tokens to schedule deductions. Use a faucet to get testnet USDT.
      </p>
    </div>
  );
}