import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getSettings } from '@/lib/db';
import { ShoppingCart, Package, Users, History, Database, LogOut, Store, LayoutDashboard } from 'lucide-react';

interface POSLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function POSLayout({ children, activeTab, onTabChange }: POSLayoutProps) {
  const { session, logout } = useAuth();
  const [storeName, setStoreName] = useState('POS System');
  const isAdmin = session?.role === 'admin';

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.storeName) {
        setStoreName(settings.storeName);
      }
    });
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart, adminOnly: false },
    { id: 'products', label: 'Products', icon: Package, adminOnly: true },
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'sales', label: 'Sales', icon: History, adminOnly: true },
    { id: 'backup', label: 'Backup', icon: Database, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-slate-300">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/3 backdrop-blur supports-[backdrop-filter]:bg-card/3 border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">{storeName}</h1>
            <p className="text-sm text-muted-foreground">
              {session?.username} ({session?.role === 'admin' ? 'Administrator' : 'Cashier'})
            </p>
          </div>
        </div>
        <Button variant="outline" size="lg" onClick={logout} className="h-12 px-4 gap-2">
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto p-4 ${isAdmin ? 'pb-28' : 'pb-8'}`}>
        {children}
      </main>

      {isAdmin && (
        <nav className="fixed bottom-0 left-3 right-3 sm:left-0 sm:right-0 bg-card/10 backdrop-blur supports-[backdrop-filter]:bg-card/3 p-2 safe-area-pb rounded-xl shadow-inner max-w-2xl mx-auto mb-3 border border-border border-20">
          <div className="flex gap-1 justify-around max-w-2xl mx-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  className={`flex-1 flex-col h-14 sm:h-16 gap-1 rounded-xl ${isActive ? '' : 'hover:bg-accent'}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="hidden sm:inline text-xs">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
