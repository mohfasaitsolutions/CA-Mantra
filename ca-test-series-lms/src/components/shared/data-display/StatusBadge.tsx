import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusType | string;
  text?: string;
  className?: string;
}

/**
 * StatusBadge component for displaying status indicators with consistent styling
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  className,
}) => {
  // Map status to variant and text
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { variant: string; defaultText: string }> = {
      success: { variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', defaultText: 'Success' },
      completed: { variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', defaultText: 'Completed' },
      active: { variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', defaultText: 'Active' },
      approved: { variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', defaultText: 'Approved' },
      
      warning: { variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', defaultText: 'Warning' },
      pending: { variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', defaultText: 'Pending' },
      inProgress: { variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', defaultText: 'In Progress' },
      review: { variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', defaultText: 'Under Review' },
      
      error: { variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', defaultText: 'Error' },
      rejected: { variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', defaultText: 'Rejected' },
      failed: { variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', defaultText: 'Failed' },
      cancelled: { variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', defaultText: 'Cancelled' },
      
      info: { variant: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary', defaultText: 'Info' },
      new: { variant: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary', defaultText: 'New' },
      
      default: { variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', defaultText: 'Default' },
      draft: { variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', defaultText: 'Draft' },
      inactive: { variant: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', defaultText: 'Inactive' },
    };

    // Normalize status to lowercase for case-insensitive matching
    const normalizedStatus = status.toLowerCase();
    
    // Find the matching status or use default
    const matchedStatus = Object.keys(statusMap).find(
      key => key.toLowerCase() === normalizedStatus
    );
    
    return matchedStatus 
      ? statusMap[matchedStatus] 
      : statusMap.default;
  };

  const { variant, defaultText } = getStatusConfig(status);
  const displayText = text || defaultText;

  return (
    <Badge 
      className={cn(
        'font-medium rounded-full px-2.5 py-0.5 text-xs',
        variant,
        className
      )}
      variant="outline"
    >
      {displayText}
    </Badge>
  );
};