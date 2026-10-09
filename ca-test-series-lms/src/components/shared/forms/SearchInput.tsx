import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

/**
 * SearchInput component for search functionality with debounce and clear button
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  onSearch,
  className,
  autoFocus = false,
  debounceMs = 300,
}) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const isControlled = externalValue !== undefined;
  const currentValue = isControlled ? externalValue : internalValue;

  // Handle debounced search
  useEffect(() => {
    if (!onSearch) return;
    
    const handler = setTimeout(() => {
      onSearch(currentValue);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [currentValue, onSearch, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(currentValue);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="pl-8 pr-8"
        autoFocus={autoFocus}
      />
      {currentValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 py-0"
          onClick={handleClear}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};