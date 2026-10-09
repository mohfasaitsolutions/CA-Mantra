import React, { ReactNode } from 'react';
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsListClassName?: string;
  tabsContentClassName?: string;
  variant?: 'default' | 'underline' | 'outline';
}

/**
 * Tabs component for tabbed navigation with consistent styling
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  tabsListClassName,
  tabsContentClassName,
  variant = 'default',
}) => {
  // Use the first tab as default if not provided
  const initialValue = defaultValue || value || tabs[0]?.value;

  // Apply variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'underline':
        return {
          list: 'bg-transparent border-b rounded-none gap-4',
          trigger: 'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
        };
      case 'outline':
        return {
          list: 'bg-transparent border rounded-lg p-1',
          trigger: 'rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm',
        };
      default:
        return {
          list: '',
          trigger: '',
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <ShadcnTabs
      defaultValue={initialValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsList className={cn('w-full', variantClasses.list, tabsListClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              tab.icon && 'flex items-center gap-2',
              variantClasses.trigger
            )}
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={cn('mt-4', tabsContentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};