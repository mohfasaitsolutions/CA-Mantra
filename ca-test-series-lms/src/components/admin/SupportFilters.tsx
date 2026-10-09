
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type SupportFiltersProps = {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
};

const SupportFilters: React.FC<SupportFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  totalTickets,
  openTickets,
  closedTickets,
}) => {
  return (
    <>
      <div className="flex gap-2 mb-6">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('all')}
        >
          All ({totalTickets})
        </Button>
        <Button
          variant={statusFilter === 'open' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('open')}
        >
          Open ({openTickets})
        </Button>
        <Button
          variant={statusFilter === 'closed' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('closed')}
        >
          Closed ({closedTickets})
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets by student name or subject..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </>
  );
};

export default SupportFilters;
