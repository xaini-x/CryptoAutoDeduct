import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WalletDetails from '@/components/wallet/WalletDetails';
import DeductionForm from '@/components/deduction/DeductionForm';
import ScheduledDeductions from '@/components/deduction/ScheduledDeductions';
import TransactionHistory from '@/components/deduction/TransactionHistory';
import ApprovalModal from '@/components/deduction/ApprovalModal';
import { useDeduction } from '@/contexts/DeductionContext';
import { Notification } from '@/components/ui/notification';

export default function Home() {
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'pending';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const { showNotification: contextShowNotification } = useDeduction();

  // Hook up the notification system from our DeductionContext to our UI
  useEffect(() => {
    // Create a wrapper function to handle notifications
    const handleNotification = (type: 'success' | 'error' | 'pending', title: string, message: string) => {
      setNotification({
        visible: true,
        type,
        title,
        message,
      });
      
      // Also call the original notification function from context
      contextShowNotification(type, title, message);
    };
    
    // Override the global showNotification in the DeductionContext
    // This approach should be reconsidered in a production app for a more robust solution
    (window as any).customShowNotification = handleNotification;
    
    return () => {
      // Clean up when component unmounts
      delete (window as any).customShowNotification;
    };
  }, [contextShowNotification]);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <WalletDetails />
            <DeductionForm />
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <ScheduledDeductions />
            <TransactionHistory />
          </div>
        </div>
      </main>
      
      <Footer />
      
      <ApprovalModal />
      
      <Notification
        title={notification.title}
        message={notification.message}
        variant={notification.type}
        visibility={notification.visible ? "shown" : "hidden"}
        onClose={closeNotification}
      />
    </div>
  );
}
