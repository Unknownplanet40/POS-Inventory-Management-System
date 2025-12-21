import { useEffect, useState } from 'react';
import { Download, X, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstalledBanner, setShowInstalledBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      // Show prompt automatically on first load
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setShowInstalledBanner(true);
      // Hide installed banner after 3 seconds
      setTimeout(() => setShowInstalledBanner(false), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted installation');
        setIsInstalled(true);
        setShowInstalledBanner(true);
        setTimeout(() => setShowInstalledBanner(false), 3000);
      } else {
        console.log('User dismissed installation');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  const handleUninstall = async () => {
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }

      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }

      console.log('✅ PWA uninstalled successfully');
      setIsInstalled(false);
      // Show prompt again after uninstall
      setShowPrompt(true);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Uninstall error:', error);
    }
  };

  // Show installed banner
  if (showInstalledBanner) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-top-2">
        <div className="bg-green-600 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
          <CheckCircle size={24} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">Stock Keeper Installed!</p>
            <p className="text-sm text-green-100">You can now use it offline</p>
          </div>
        </div>
      </div>
    );
  }

  // If already installed, show uninstall button
  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleUninstall}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl shadow-lg transition-colors font-medium"
          title="Uninstall Stock Keeper"
        >
          <X size={18} />
          <span className="text-sm">Uninstall</span>
        </button>
      </div>
    );
  }

  // Show install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <Download size={28} />
              <h2 className="text-2xl font-bold">Install Stock Keeper</h2>
            </div>
            <p className="text-blue-100">Get the best experience on your device</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Instant Access</p>
                  <p className="text-sm text-slate-600">Open directly from your home screen</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Works Offline</p>
                  <p className="text-sm text-slate-600">Keep using it even without internet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Full Features</p>
                  <p className="text-sm text-slate-600">All tools available in app form</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Download size={18} />
              Install Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
