import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  label?: string;
  placeholder?: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * FilterSelect component for filtering data with a dropdown
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  placeholder = 'Select option',
  options,
  value,
  onChange,
  className,
}) => {
  const handleValueChange = (newValue: string) => {
    onChange?.(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};