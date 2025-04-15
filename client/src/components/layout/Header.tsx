import { useWallet } from '@/contexts/WalletContext';
import WalletConnect from '@/components/wallet/WalletConnect';
import { Currency } from 'lucide-react';

export default function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Currency className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold">CryptoFlow</h1>
        </div>
        
        <WalletConnect />
      </div>
    </header>
  );
}
