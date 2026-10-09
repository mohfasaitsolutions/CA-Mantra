import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContentSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * ContentSection component provides consistent spacing between page sections
 */
export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  className,
  id,
}) => {
  return (
    <section
      id={id}
      className={cn('mb-8 md:mb-12', className)}
    >
      {children}
    </section>
  );
};