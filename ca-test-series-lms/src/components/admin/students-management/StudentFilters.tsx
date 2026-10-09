
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StudentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  purchaseFilter: 'all' | 'purchased' | 'not_purchased';
  setPurchaseFilter: (value: 'all' | 'purchased' | 'not_purchased') => void;
}

const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  purchaseFilter,
  setPurchaseFilter,
}) => {
  const getFilterLabel = () => {
    switch (purchaseFilter) {
      case 'purchased':
        return 'Tests Purchased';
      case 'not_purchased':
        return 'No Tests Purchased';
      default:
        return 'Filter by Purchase';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            {getFilterLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setPurchaseFilter('all')}>
            All Students
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPurchaseFilter('purchased')}>
            Tests Purchased
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPurchaseFilter('not_purchased')}>
            No Tests Purchased
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StudentFilters;
