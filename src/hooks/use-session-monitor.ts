import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

const SESSION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useSessionMonitor() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/validate-session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.valid) {
        // Session is invalid - user logged in from another browser
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast({
          title: 'Session Expired',
          description: 'You have been logged in from another device. Please login again.',
          variant: 'destructive',
        });

        navigate('/');
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }, [navigate, toast]);

  useEffect(() => {
    // Start session monitoring
    const intervalId = setInterval(validateSession, SESSION_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [validateSession]);

  return { validateSession };
}
