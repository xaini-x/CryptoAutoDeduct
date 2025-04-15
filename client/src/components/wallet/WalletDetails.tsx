import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, XCircle } from 'lucide-react';

export default function WalletDetails() {
  const { isConnected, address, network, balance, connectWallet } = useWallet();

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2">
        <CardTitle className="text-xl font-semibold mb-4 md:mb-0">Wallet Details</CardTitle>
        {isConnected ? (
          <div className="flex items-center text-green-500">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>Connected</span>
          </div>
        ) : (
          <div className="flex items-center text-red-500">
            <XCircle className="h-4 w-4 mr-1" />
            <span>Disconnected</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-700 h-48">
            <Wallet className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400 text-center mb-4">Connect your wallet to view balance and transaction history</p>
            <Button onClick={connectWallet} className="bg-primary hover:bg-primary/90 text-white">
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
                <div className="font-mono break-all text-sm">{address}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Network</div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span>{network?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Balance</div>
              <div className="flex items-end">
                <span className="text-3xl font-semibold mr-2">{balance?.balance ? parseFloat(balance.balance).toFixed(5) : '0.00'}</span>
                <span className="text-lg text-gray-400">{balance?.symbol || 'ETH'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">${balance?.usdValue || '0.00'} USD</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
