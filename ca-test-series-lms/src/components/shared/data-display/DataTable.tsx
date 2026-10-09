import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyState?: {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
  };
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
}

/**
 * DataTable component for displaying tabular data with customizable columns
 */
export function DataTable<T>({
  data,
  columns,
  emptyState,
  isLoading = false,
  onRowClick,
  className
}: DataTableProps<T>) {
  const defaultEmptyState = {
    title: 'No data available',
    description: 'There are no items to display at the moment.',
  };

  const emptyStateConfig = { ...defaultEmptyState, ...emptyState };

  if (isLoading) {
    return (
      <div className="w-full py-10">
        <div className="flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState {...emptyStateConfig} />;
  }

  return (
    <div className={cn('w-full', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={column.className}>
                  {column.cell
                    ? column.cell(item)
                    : column.accessorKey
                      ? String(item[column.accessorKey] || '')
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}