import { useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useDeduction, DeductionInterval } from '@/contexts/DeductionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle } from 'lucide-react';
import TokenSelect from '@/components/wallet/TokenSelect';

export default function DeductionForm() {
  const { isConnected, balance, selectedToken, tokenBalances } = useWallet();
  const { formData, updateFormData, submitDeduction } = useDeduction();
  const ethPrice = balance?.usdValue ? parseFloat(balance.usdValue) / parseFloat(balance.balance) : 2000;
  
  // We're using USDT for all deductions
  const selectedTokenSymbol = 'USDT';
  
  // Set default start date to tomorrow
  useEffect(() => {
    if (!formData.startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateFormData({ 
        startDate: tomorrow.toISOString().split('T')[0]
      });
    }
  }, [formData.startDate, updateFormData]);

  // Calculate USD value of amount
  const amountInUsd = formData.amount 
    ? `≈ $${(parseFloat(formData.amount) * ethPrice).toFixed(2)} USD`
    : '≈ $0.00 USD';

  // Calculate total tokens over period for summary
  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount <= 0 || !formData.interval) return `0.00 ${selectedTokenSymbol}`;
    
    const periodsPerMonth: Record<DeductionInterval, number> = {
      'daily': 30,
      'weekly': 4.33,
      'biweekly': 2.17,
      'monthly': 1
    };
    
    if (formData.duration === 'indefinite') {
      const monthlyTotal = amount * periodsPerMonth[formData.interval];
      return `${monthlyTotal.toFixed(5)} ${selectedTokenSymbol} per month`;
    }
    
    const months = parseInt(formData.duration);
    const total = amount * periodsPerMonth[formData.interval] * months;
    return `${total.toFixed(5)} ${selectedTokenSymbol}`;
  };

  const handleIntervalSelect = (interval: DeductionInterval) => {
    updateFormData({ interval });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitDeduction();
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Set Up Automated Deduction</CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isConnected && (
          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-700 mb-6 flex items-start">
            <AlertCircle className="text-yellow-500 mr-2 mt-0.5 h-5 w-5" />
            <p className="text-sm text-yellow-500">Connect your wallet to set up automated deductions</p>
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Token Select */}
          {isConnected && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Token To Deduct
              </Label>
              <TokenSelect />
            </div>
          )}
          
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="deductionAmount" className="text-sm font-medium text-gray-300">
              Deduction Amount
            </Label>
            <div className="relative">
              <Input 
                id="deductionAmount"
                type="number"
                placeholder="0.00"
                step="0.001"
                min="0"
                className="bg-gray-800 border-gray-700 pr-16"
                value={formData.amount}
                onChange={(e) => updateFormData({ amount: e.target.value })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                {selectedTokenSymbol}
              </div>
            </div>
            <div className="text-sm text-gray-400">{amountInUsd}</div>
          </div>
          
          {/* Interval Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">
              Deduction Interval
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(["daily", "weekly", "biweekly", "monthly"] as DeductionInterval[]).map((interval) => (
                <Button
                  key={interval}
                  type="button"
                  variant="outline"
                  className={`bg-gray-800 border-gray-700 hover:bg-gray-700 ${
                    formData.interval === interval ? 'bg-primary text-white border-primary' : ''
                  }`}
                  onClick={() => handleIntervalSelect(interval)}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Duration Selector */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium text-gray-300">
              Duration
            </Label>
            <Select 
              value={formData.duration} 
              onValueChange={(value) => updateFormData({ duration: value as any })}
            >
              <SelectTrigger id="duration" className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="indefinite">Indefinite (until canceled)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Start Date Selector */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-300">
              Start Date
            </Label>
            <Input 
              id="startDate"
              type="date"
              className="bg-gray-800 border-gray-700"
              value={formData.startDate}
              onChange={(e) => updateFormData({ startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          {/* Summary and Submit */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-medium mb-3">Deduction Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Token:</span>
                <span>{selectedTokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span>{formData.amount ? `${formData.amount} ${selectedTokenSymbol}` : `0.00 ${selectedTokenSymbol}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frequency:</span>
                <span>
                  {formData.interval 
                    ? formData.interval.charAt(0).toUpperCase() + formData.interval.slice(1) 
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span>
                  {formData.duration === 'indefinite' 
                    ? 'Indefinite' 
                    : `${formData.duration} months`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">First deduction:</span>
                <span>
                  {formData.startDate 
                    ? new Date(formData.startDate).toLocaleDateString() 
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-700">
                <span>Total over period:</span>
                <span>{calculateTotal()}</span>
              </div>
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              disabled={!isConnected || !formData.amount || !formData.interval}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Set Up Deduction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
