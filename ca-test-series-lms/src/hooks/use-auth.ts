import { useAuthStore } from '@/lib/store';
import { getPostLoginRedirect } from '@/lib/api/auth';

export const useAuth = () => {
  const { user, isAuthenticated, token, isLoading } = useAuthStore();
  
  console.log('🔍 useAuth hook called, user:', !!user, 'isAuthenticated:', isAuthenticated, 'token:', !!token);
  
  const getDashboardPath = () => {
    if (!user?.role) return '/student/dashboard';
    return getPostLoginRedirect(user.role);
  };
  
  const isLoggedIn = isAuthenticated && !!token && !!user;
  
  return {
    user,
    token,
    isLoggedIn,
    isAuthenticated,
    isLoading,
    role: user?.role,
    getDashboardPath,
  };
};
