import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session, getSession, login as authLogin, logout as authLogout } from '@/lib/auth';
import { getSettings, AppSettings } from '@/lib/db';
import { clearAuthToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_BASE_URL } from '@/config/api.config';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  backendDown: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_INTERVAL = 30000; // Check every 30 seconds
const BACKEND_HEALTH_CHECK_INTERVAL = 5000; // Check backend every 5 seconds when offline

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [backendDown, setBackendDown] = useState(false);
  const { toast } = useToast();

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const refreshSetupStatus = async () => {
    try {
      const settings = await getSettings();
      setIsSetupComplete(settings?.isSetupComplete ?? false);
      setBackendDown(false);
    } catch (err) {
      setBackendDown(true);
      setIsSetupComplete(false);
      throw err;
    }
  };

  const validateSession = useCallback(async () => {
    const sessionData = localStorage.getItem('pos-session');
    
    if (!sessionData || !session) {
      return;
    }

    try {
      const parsedSession = JSON.parse(sessionData);
      const token = parsedSession.token;
      
      if (!token) {
        return;
      }

      const response = await fetch(`${BACKEND_BASE_URL}/api/auth/validate-session`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log('[SESSION] Validation request failed:', response.status);
        return;
      }

      const data = await response.json();

      if (!data.valid) {
        // Session is invalid - user logged in from another browser
        console.log('[SESSION] Session invalidated - logging out');
        localStorage.removeItem('pos-session');
        clearAuthToken();
        setSession(null);
        
        toast({
          title: 'Session Expired',
          description: 'You have been logged in from another device. Please login again.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        console.log('[SESSION] Session is valid');
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }, [session, toast]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentSession = getSession();
        setSession(currentSession);
        await refreshSetupStatus();
      } catch {
        // backendDown already set
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Backend health monitoring when offline
  useEffect(() => {
    if (!backendDown) {
      return;
    }

    console.log('[BACKEND] Backend is down, starting health checks...');
    
    const healthCheckInterval = setInterval(async () => {
      console.log('[BACKEND] Checking backend health...');
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        console.log('[BACKEND] Backend is back online!');
        try {
          await refreshSetupStatus();
          toast({
            title: 'Backend Online',
            description: 'Successfully reconnected to the backend server.',
            variant: 'default',
          });
        } catch {
          // Backend might still be initializing
        }
      }
    }, BACKEND_HEALTH_CHECK_INTERVAL);

    return () => clearInterval(healthCheckInterval);
  }, [backendDown, toast]);

  // Session monitoring
  useEffect(() => {
    if (!session) {
      return;
    }

    // Start session monitoring
    const intervalId = setInterval(validateSession, SESSION_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [session, validateSession]);

  const login = async (username: string, password: string) => {
    const newSession = await authLogin(username, password);
    setSession(newSession);
  };

  const logout = async () => {
    await authLogout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isSetupComplete,
        backendDown,
        login,
        logout,
        refreshSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
