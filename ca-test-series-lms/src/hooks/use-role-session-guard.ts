import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to enforce single-role session across tabs
 * 
 * SECURITY FEATURE:
 * Prevents admin and student from being logged in simultaneously in different tabs
 * of the same browser. This is crucial for security to prevent:
 * - Role confusion and unintended actions
 * - Security vulnerabilities from mixed sessions
 * - Data access from wrong role context
 * 
 * HOW IT WORKS:
 * 1. Monitors localStorage changes via the 'storage' event (fired across tabs)
 * 2. When a login occurs in another tab, the storage event is triggered
 * 3. Compares the new role with the current tab's role
 * 4. If roles differ, automatically logs out the current tab and redirects to login
 * 5. Shows an alert to inform the user about the role conflict
 * 
 * EXAMPLE SCENARIO:
 * - Tab A: Admin logs in
 * - Tab B: Student tries to login
 * - Result: Tab A is automatically logged out with a security notice
 * 
 * NOTE: The 'storage' event only fires when localStorage changes in OTHER tabs,
 * not in the same tab. This is a built-in browser feature.
 */
export const useRoleSessionGuard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const currentRoleRef = useRef<string | undefined>();

  useEffect(() => {
    if (!user?.role) return;

    // Update current role reference
    currentRoleRef.current = user.role;

    // Handler for storage events (fired when localStorage changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle our auth storage
      if (e.key !== 'ca-prep-auth-storage') return;

      try {
        // Parse the new storage value
        const newData = e.newValue ? JSON.parse(e.newValue) : null;
        const newRole = newData?.state?.user?.role;
        const currentRole = currentRoleRef.current;

        console.log('🔐 Role session guard - Storage change detected:', {
          currentRole,
          newRole,
          changed: newRole !== currentRole
        });

        // If role has changed in another tab, logout and redirect
        if (newRole && currentRole && newRole !== currentRole) {
          console.warn('⚠️ Role conflict detected! Logging out this session.');
          
          // Show alert to user
          alert(
            `Security Notice: A different role (${newRole}) has logged in on another tab. ` +
            `You have been logged out from this session (${currentRole}).`
          );

          // Logout current session
          logout();
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing storage event:', error);
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.role, logout, navigate]);

  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('⚠️ Session expired! Logging out.');
      alert('Your session has expired or is invalid. Please login again to continue.');
      logout();
      navigate('/login', { replace: true });
    };

    window.addEventListener('session-expired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, [logout, navigate]);
};
