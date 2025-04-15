import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, History, CheckCircle, XCircle } from 'lucide-react';
import { Transaction } from '@shared/schema';

export default function TransactionHistory() {
  const { isConnected, address } = useWallet();

  // Fetch transaction history
  const { data: transactions, isLoading } = useQuery({
    queryKey: address ? [`/api/transactions/${address}`] : [],
    enabled: !!address && isConnected,
  });

  const getTimeAgo = (date: string) => {
    const txDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - txDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Transaction History</CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isConnected || !transactions || (transactions && transactions.length === 0) ? (
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center border border-gray-700 h-40">
            <History className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-gray-400 text-center">
              {!isConnected 
                ? "Connect your wallet to view transaction history" 
                : isLoading 
                  ? "Loading..." 
                  : "No transaction history yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 relative pl-6">
            <div className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-gray-700 z-0"></div>
            
            {transactions.map((tx: Transaction) => (
              <div key={tx.id} className="relative z-10">
                <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full ${
                  tx.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium">
                      {tx.amount} {tx.amount === '0' ? 'ETH Deduction Setup' : 'ETH Deducted'}
                    </div>
                    <div className="text-xs text-gray-400">{getTimeAgo(tx.date.toString())}</div>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-2">
                    {tx.status === 'success' 
                      ? 'Automated deduction successfully processed' 
                      : 'Transaction failed'
                    }
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    {tx.txHash && (
                      <a 
                        href={`https://etherscan.io/tx/${tx.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/90 transition-colors flex items-center"
                      >
                        View on Etherscan
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                    
                    <div className={tx.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                      {tx.status === 'success' ? (
                        <span className="flex items-center">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Successful
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
