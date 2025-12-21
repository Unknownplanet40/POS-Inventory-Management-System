import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { POSLayout } from './POSLayout';
import { DashboardPage } from './DashboardPage';
import { CheckoutPage } from './CheckoutPage';
import { ProductsPage } from './ProductsPage';
import { UsersPage } from './UsersPage';
import { SalesPage } from './SalesPage';
import { BackupPage } from './BackupPage';

export function POSApp() {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const [acknowledgedMobile, setAcknowledgedMobile] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  
  const defaultTab = session?.role === 'admin' ? 'dashboard' : 'checkout';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (activeTab === 'checkout' && session?.role === 'admin') {
      setActiveTab('dashboard');
    }
  }, [session]);

  const handleTabChange = (newTab: string) => {
    if (activeTab === 'checkout' && cartItemCount > 0 && newTab !== 'checkout') {
      setPendingTab(newTab);
      setShowNavigationWarning(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const confirmNavigation = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      setCartItemCount(0);
    }
    setShowNavigationWarning(false);
    setPendingTab(null);
  };

  const cancelNavigation = () => {
    setShowNavigationWarning(false);
    setPendingTab(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return session?.role === 'admin' ? <DashboardPage /> : null;
      case 'checkout':
        return <CheckoutPage onCartChange={setCartItemCount} />;
      case 'products':
        return session?.role === 'admin' ? <ProductsPage /> : null;
      case 'users':
        return session?.role === 'admin' ? <UsersPage /> : null;
      case 'sales':
        return session?.role === 'admin' ? <SalesPage /> : null;
      case 'backup':
        return session?.role === 'admin' ? <BackupPage /> : null;
      default:
        return session?.role === 'admin' ? <DashboardPage /> : <CheckoutPage />;
    }
  };

  return (
    <>
      {isMobile && !acknowledgedMobile && (
        <AlertDialog open={isMobile && !acknowledgedMobile}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Screen size Change Detected</AlertDialogTitle>
              <AlertDialogDescription>
                We detected that your device screen size is small. For the best experience, please use a tablet or desktop device to access the POS system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => setAcknowledgedMobile(true)}>
              Continue
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <AlertDialog open={showNavigationWarning}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Cart Items?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in your cart. Are you sure you want to leave without checking out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <button
              onClick={cancelNavigation}
              className="flex-1 h-10 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium"
            >
              Keep Shopping
            </button>
            <button
              onClick={confirmNavigation}
              className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium"
            >
              Discard & Leave
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <POSLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </POSLayout>
    </>
  );
}
