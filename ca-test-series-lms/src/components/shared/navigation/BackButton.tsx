import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

/**
 * BackButton component for navigating back
 */
export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  className,
  variant = 'ghost',
  size = 'default',
  showIcon = true,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('flex items-center', className)}
      onClick={handleClick}
    >
      {showIcon && <ChevronLeft className="mr-1 h-4 w-4" />}
      {label}
    </Button>
  );
};