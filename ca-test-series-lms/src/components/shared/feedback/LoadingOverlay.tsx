import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  blur?: boolean;
}

/**
 * LoadingOverlay component for full-screen or container loading states
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  className,
  spinnerSize = 'md',
  blur = true,
}) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center z-50',
        blur ? 'bg-background/80 backdrop-blur-sm' : 'bg-background/50',
        className
      )}
    >
      <LoadingSpinner size={spinnerSize} />
      {text && <p className="mt-4 text-sm font-medium">{text}</p>}
    </div>
  );
};