
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EvaluationFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterPeriod: string;
  setFilterPeriod: (value: string) => void;
}

const EvaluationFilters: React.FC<EvaluationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterPeriod,
  setFilterPeriod,
}) => {
  return (
    <div className="flex gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Search by Test ID, student..." 
          className="pl-8 w-[200px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Select 
        value={filterPeriod} 
        onValueChange={setFilterPeriod}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Filter Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default EvaluationFilters;
