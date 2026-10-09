import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormRowProps {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FormRow component for organizing form fields with label, description, and error message
 */
export const FormRow: React.FC<FormRowProps> = ({
  label,
  description,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div>{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};