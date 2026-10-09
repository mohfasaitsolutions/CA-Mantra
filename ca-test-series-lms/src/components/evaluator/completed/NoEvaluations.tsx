
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface NoEvaluationsProps {
  isFiltering: boolean;
}

const NoEvaluations: React.FC<NoEvaluationsProps> = ({ isFiltering }) => {
  return (
    <div className="text-center py-8">
      <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Completed Evaluations</h3>
      <p className="text-gray-500">
        {isFiltering 
          ? "No evaluations match your search criteria" 
          : "You haven't completed any evaluations yet"}
      </p>
    </div>
  );
};

export default NoEvaluations;
