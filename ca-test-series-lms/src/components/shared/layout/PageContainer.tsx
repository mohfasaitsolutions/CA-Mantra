import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

/**
 * PageContainer component provides consistent padding and max-width for page content
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  fullWidth = false,
}) => {
  return (
    <div
      className={cn(
        'w-full px-4 py-6 md:px-6 lg:px-8',
        fullWidth ? 'max-w-full' : 'max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};