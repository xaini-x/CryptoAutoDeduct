import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { apiRequest } from '@/lib/queryClient';
import web3Service from '@/lib/web3';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ScheduledDeduction, Transaction } from '@shared/schema';

export type DeductionInterval = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DeductionDuration = '3' | '6' | '12' | 'indefinite';

interface DeductionFormData {
  amount: string;
  interval: DeductionInterval | null;
  duration: DeductionDuration;
  startDate: string;
}

type NotificationType = 'success' | 'error' | 'pending';

interface DeductionContextType {
  isSubmitting: boolean;
  showApprovalModal: boolean;
  formData: DeductionFormData;
  updateFormData: (data: Partial<DeductionFormData>) => void;
  resetForm: () => void;
  submitDeduction: () => Promise<void>;
  cancelDeduction: (id: number) => Promise<void>;
  openApprovalModal: () => void;
  closeApprovalModal: () => void;
  approveDeduction: () => Promise<void>;
  showNotification: (type: NotificationType, title: string, message: string) => void;
}

const defaultFormData: DeductionFormData = {
  amount: '',
  interval: null,
  duration: '3',
  startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
};

const DeductionContext = createContext<DeductionContextType>({
  isSubmitting: false,
  showApprovalModal: false,
  formData: defaultFormData,
  updateFormData: () => {},
  resetForm: () => {},
  submitDeduction: async () => {},
  cancelDeduction: async () => {},
  openApprovalModal: () => {},
  closeApprovalModal: () => {},
  approveDeduction: async () => {},
  showNotification: () => {},
});

export const useDeduction = () => useContext(DeductionContext);

interface DeductionProviderProps {
  children: ReactNode;
}

export const DeductionProvider: React.FC<DeductionProviderProps> = ({ children }) => {
  const { address } = useWallet();
  const { toast } = useToast();
  const [formData, setFormData] = useState<DeductionFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const updateFormData = useCallback((data: Partial<DeductionFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
  }, []);

  const openApprovalModal = useCallback(() => {
    setShowApprovalModal(true);
  }, []);

  const closeApprovalModal = useCallback(() => {
    setShowApprovalModal(false);
  }, []);

  const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
    let variant: 'default' | 'destructive' | null = null;
    
    switch (type) {
      case 'success':
        variant = 'default';
        break;
      case 'error':
        variant = 'destructive';
        break;
      case 'pending':
        variant = null;
        break;
    }
    
    toast({
      title,
      description: message,
      variant,
    });
  }, [toast]);

  const getIntervalInDays = (interval: DeductionInterval): number => {
    switch (interval) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'biweekly': return 14;
      case 'monthly': return 30;
    }
  };

  const submitDeduction = useCallback(async () => {
    if (!address) {
      showNotification('error', 'Wallet Not Connected', 'Please connect your wallet to continue.');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showNotification('error', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!formData.interval) {
      showNotification('error', 'Interval Not Selected', 'Please select a deduction interval.');
      return;
    }

    openApprovalModal();
  }, [address, formData, openApprovalModal, showNotification]);

  // Get wallet information
  const { balance, selectedToken } = useWallet();
  const selectedTokenSymbol = balance?.symbol || 'ETH';
  
  const approveDeduction = useCallback(async () => {
    if (!address || !formData.interval) return;
    
    closeApprovalModal();
    setIsSubmitting(true);
    showNotification('pending', 'Transaction Pending', 'Your transaction is being processed.');

    try {
      
      // 1. Submit to blockchain
      const startDateTimestamp = new Date(formData.startDate).getTime() / 1000;
      const txHash = await web3Service.scheduleDeduction(
        formData.amount,
        getIntervalInDays(formData.interval),
        formData.duration === 'indefinite' ? 'indefinite' : parseInt(formData.duration),
        startDateTimestamp
      );

      // 2. Save to backend
      const deduction: Omit<ScheduledDeduction, 'id' | 'createdAt'> = {
        userId: 1, // Placeholder, in a real app we'd have proper user management
        walletAddress: address,
        amount: formData.amount,
        tokenSymbol: selectedTokenSymbol,
        tokenAddress: selectedToken || '',
        interval: formData.interval,
        duration: formData.duration,
        startDate: new Date(formData.startDate),
        status: 'approved',
      };

      const response = await apiRequest('POST', '/api/deductions', deduction);
      const savedDeduction = await response.json();

      // 3. Record the transaction
      const transaction: Omit<Transaction, 'id'> = {
        deductionId: savedDeduction.id,
        walletAddress: address,
        amount: formData.amount,
        tokenSymbol: selectedTokenSymbol,
        tokenAddress: selectedToken || '',
        status: 'success',
        date: new Date(),
        txHash,
      };

      await apiRequest('POST', '/api/transactions', transaction);

      // 4. Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: [`/api/deductions/${address}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${address}`] });

      // 5. Show success notification and reset form
      showNotification('success', 'Transaction Successful', 'Your deduction has been set up successfully.');
      resetForm();
    } catch (error) {
      console.error('Failed to set up deduction:', error);
      showNotification('error', 'Transaction Failed', error instanceof Error ? error.message : 'Failed to set up deduction.');
    } finally {
      setIsSubmitting(false);
    }
  }, [address, formData, closeApprovalModal, showNotification, resetForm, selectedToken, selectedTokenSymbol]);

  const cancelDeduction = useCallback(async (id: number) => {
    if (!address) return;
    
    try {
      showNotification('pending', 'Cancellation Pending', 'Processing your cancellation request...');
      
      // 1. Call blockchain to cancel
      await web3Service.cancelDeduction(id);
      
      // 2. Update backend
      await apiRequest('DELETE', `/api/deductions/${id}`);
      
      // 3. Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: [`/api/deductions/${address}`] });
      
      showNotification('success', 'Cancellation Successful', 'Deduction has been cancelled successfully.');
    } catch (error) {
      console.error('Failed to cancel deduction:', error);
      showNotification('error', 'Cancellation Failed', error instanceof Error ? error.message : 'Failed to cancel deduction.');
    }
  }, [address, showNotification]);

  const value = {
    isSubmitting,
    showApprovalModal,
    formData,
    updateFormData,
    resetForm,
    submitDeduction,
    cancelDeduction,
    openApprovalModal,
    closeApprovalModal,
    approveDeduction,
    showNotification,
  };

  return (
    <DeductionContext.Provider value={value}>
      {children}
    </DeductionContext.Provider>
  );
};
