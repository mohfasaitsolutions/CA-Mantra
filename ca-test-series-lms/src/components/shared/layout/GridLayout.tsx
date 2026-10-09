import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6;

interface GridLayoutProps {
  children: ReactNode;
  columns?: {
    sm?: GridColumns;
    md?: GridColumns;
    lg?: GridColumns;
    xl?: GridColumns;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * GridLayout component provides a responsive grid layout with configurable columns at different breakpoints
 */
export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3,
  },
  gap = 'md',
  className,
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const getColumnsClass = (cols: GridColumns) => {
    const classes = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    return classes[cols];
  };

  return (
    <div
      className={cn(
        'grid',
        columns.sm && getColumnsClass(columns.sm),
        columns.md && `md:${getColumnsClass(columns.md)}`,
        columns.lg && `lg:${getColumnsClass(columns.lg)}`,
        columns.xl && `xl:${getColumnsClass(columns.xl)}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};