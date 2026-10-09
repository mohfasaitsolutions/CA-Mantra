import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';

let hasInitialized = false;

export const useAuthInit = () => {
  const { token, isAuthenticated, fetchProfile } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    // Only initialize once per app session
    if (hasInitialized || initRef.current) return;
    
    // If we have a token but no user, fetch profile once
    if (token && !isAuthenticated) {
      hasInitialized = true;
      initRef.current = true;
      fetchProfile(true).catch(() => {
        // Silent fail - let user login manually if needed
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]); // Remove fetchProfile from dependencies
};
