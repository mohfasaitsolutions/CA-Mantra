import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePreventBackNavigation = (isSubmitted: boolean) => {
  const location = useLocation();

  useEffect(() => {
    if (!isSubmitted) return;

    const handlePopState = () => {
      // Push the current state back to prevent going back
      window.history.pushState(null, "", window.location.href);
    };

    // Add initial history entry
    window.history.pushState(null, "", window.location.href);
    
    // Listen for back button
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isSubmitted, location.pathname]);
};
