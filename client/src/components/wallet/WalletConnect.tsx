import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet } from 'lucide-react';
import { useMemo } from 'react';

export default function WalletConnect() {
  const { isConnected, isConnecting, address, connectWallet, disconnectWallet } = useWallet();
  
  const shortenedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return (
    <div className="flex items-center">
      {!isConnected ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      ) : (
        <div className="flex items-center bg-gray-800 rounded-lg px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span className="font-mono text-sm mr-2 max-w-[120px] md:max-w-[180px] truncate">
            {shortenedAddress}
          </span>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={disconnectWallet}
            aria-label="Disconnect wallet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
