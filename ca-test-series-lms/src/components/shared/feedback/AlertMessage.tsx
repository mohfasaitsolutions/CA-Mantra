import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertMessageProps {
  type: AlertType;
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

/**
 * AlertMessage component for displaying alert messages with consistent styling
 */
export const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  title,
  message,
  className,
  onClose,
}) => {
  const getAlertConfig = (type: AlertType) => {
    const configs = {
      info: {
        icon: <Info className="h-4 w-4" />,
        className: 'border-primary/20 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary',
        defaultTitle: 'Information',
      },
      success: {
        icon: <CheckCircle className="h-4 w-4" />,
        className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
        defaultTitle: 'Success',
      },
      warning: {
        icon: <AlertCircle className="h-4 w-4" />,
        className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300',
        defaultTitle: 'Warning',
      },
      error: {
        icon: <XCircle className="h-4 w-4" />,
        className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
        defaultTitle: 'Error',
      },
    };
    return configs[type];
  };

  const { icon, className: typeClassName, defaultTitle } = getAlertConfig(type);
  const displayTitle = title || defaultTitle;

  return (
    <Alert className={cn(typeClassName, className)}>
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <AlertTitle>{displayTitle}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-background/20"
          aria-label="Close"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};