import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import { useDeduction } from '@/contexts/DeductionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, X, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScheduledDeduction } from '@shared/schema';

export default function ScheduledDeductions() {
  const { isConnected, address } = useWallet();
  const { cancelDeduction } = useDeduction();
  const [selectedDeduction, setSelectedDeduction] = useState<number | null>(null);

  // Fetch scheduled deductions
  const { data: deductions, isLoading } = useQuery({
    queryKey: address ? [`/api/deductions/${address}`] : [],
    enabled: !!address && isConnected,
  });

  const handleOpenCancelDialog = (id: number) => {
    setSelectedDeduction(id);
  };

  const handleCloseCancelDialog = () => {
    setSelectedDeduction(null);
  };

  const handleCancelDeduction = async () => {
    if (selectedDeduction !== null) {
      await cancelDeduction(selectedDeduction);
      setSelectedDeduction(null);
    }
  };

  const formatNextDeduction = (deduction: ScheduledDeduction) => {
    const startDate = new Date(deduction.startDate);
    
    // If start date is in the future, that's the next deduction
    if (startDate > new Date()) {
      return startDate.toLocaleDateString();
    }
    
    // Otherwise calculate the next deduction based on interval
    const now = new Date();
    let nextDate = new Date(startDate);
    
    while (nextDate <= now) {
      switch (deduction.interval) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }
    }
    
    return nextDate.toLocaleDateString();
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Scheduled Deductions</CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isConnected || !deductions || (deductions && deductions.length === 0) ? (
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center border border-gray-700 h-40">
            <Calendar className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-gray-400 text-center">
              {!isConnected 
                ? "Connect your wallet to view scheduled deductions" 
                : isLoading 
                  ? "Loading..." 
                  : "No scheduled deductions yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deductions.map((deduction: ScheduledDeduction) => (
              <div 
                key={deduction.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{deduction.amount} ETH</div>
                    <div className="text-gray-400 text-sm">
                      {deduction.interval.charAt(0).toUpperCase() + deduction.interval.slice(1)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      aria-label="Edit deduction"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                      aria-label="Cancel deduction"
                      onClick={() => handleOpenCancelDialog(deduction.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="text-gray-400">
                    Next: <span className="text-white">{formatNextDeduction(deduction)}</span>
                  </div>
                  <div className={deduction.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}>
                    {deduction.status.charAt(0).toUpperCase() + deduction.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={selectedDeduction !== null} onOpenChange={(open) => !open && handleCloseCancelDialog()}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Deduction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this automated deduction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleCancelDeduction}
            >
              Yes, Cancel Deduction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
