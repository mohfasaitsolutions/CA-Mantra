import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  rightContent?: ReactNode;
  className?: string;
}

/**
 * SectionHeader component provides consistent styling for section headers
 * with optional description and right-aligned content (like action buttons)
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  rightContent,
  className,
}) => {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between mb-6', className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {rightContent && (
        <div className="mt-4 md:mt-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};