import { useDeduction } from '@/contexts/DeductionContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function ApprovalModal() {
  const { showApprovalModal, closeApprovalModal, approveDeduction, formData, isSubmitting } = useDeduction();

  const calculateTotal = () => {
    if (!formData.amount || !formData.interval) return '0.00 ETH';
    
    const amount = parseFloat(formData.amount);
    const periodsPerMonth: Record<string, number> = {
      'daily': 30,
      'weekly': 4.33,
      'biweekly': 2.17,
      'monthly': 1
    };
    
    if (formData.duration === 'indefinite') {
      const monthlyTotal = amount * periodsPerMonth[formData.interval];
      return `${monthlyTotal.toFixed(5)} ETH per month`;
    } else {
      const months = parseInt(formData.duration);
      const total = amount * periodsPerMonth[formData.interval] * months;
      return `${total.toFixed(5)} ETH`;
    }
  };

  return (
    <Dialog open={showApprovalModal} onOpenChange={(open) => !open && closeApprovalModal()}>
      <DialogContent className="bg-gray-900 border-gray-800 sm:max-w-lg">
        <DialogHeader className="flex justify-between items-start">
          <DialogTitle className="text-lg font-medium">Approve Automated Deduction</DialogTitle>
          <DialogClose className="text-gray-400 hover:text-white" asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
          <div className="flex items-center mb-4">
            <div className="bg-primary bg-opacity-20 rounded-full p-2 mr-3">
              <CheckCircle className="text-primary h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Permission Request</h4>
              <p className="text-sm text-gray-400">You're granting permission for automated deductions</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Deduction amount:</span>
              <span className="font-medium">{formData.amount || '0.00'} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frequency:</span>
              <span className="font-medium">
                {formData.interval 
                  ? formData.interval.charAt(0).toUpperCase() + formData.interval.slice(1) 
                  : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="font-medium">
                {formData.duration === 'indefinite' 
                  ? 'Indefinite' 
                  : `${formData.duration} months`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">First deduction on:</span>
              <span className="font-medium">
                {formData.startDate 
                  ? new Date(formData.startDate).toLocaleDateString() 
                  : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700">
              <span className="font-medium">Total over period:</span>
              <span className="font-medium">{calculateTotal()}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4 border border-yellow-700 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-500 mr-2 mt-0.5 h-5 w-5" />
            <div className="text-sm text-yellow-500">
              <p className="font-medium mb-1">Important Information</p>
              <p>By confirming, you're authorizing smart contract to automatically deduct the specified amount at regular intervals. You can cancel this at any time.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between gap-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-1/2 border-gray-700 bg-gray-800 hover:bg-gray-700"
            onClick={closeApprovalModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-1/2 bg-primary hover:bg-primary/90"
            onClick={approveDeduction}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
