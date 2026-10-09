import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Card component for displaying content in a card format with optional title, description, icon, and footer
 */
export const Card: React.FC<CardProps> = ({
  title,
  description,
  icon,
  children,
  footer,
  className,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        hoverable && 'transition-all hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || description || icon) && (
        <div className="flex flex-row items-center space-x-4 p-6 pb-2">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className="p-6 pt-2">{children}</div>
      {footer && (
        <div className="border-t bg-muted/50 px-6 py-4">{footer}</div>
      )}
    </div>
  );
};