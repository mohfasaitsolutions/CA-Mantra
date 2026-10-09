
import React from 'react';
import { Button } from '@/components/ui/button';
import { CompletedEvaluation } from '@/types/evaluation';
import { formatDate } from '@/utils/dateUtils';

interface EvaluationsTableProps {
  evaluations: CompletedEvaluation[];
  onViewDetails: (evaluation: CompletedEvaluation) => void;
}

const EvaluationsTable: React.FC<EvaluationsTableProps> = ({ evaluations, onViewDetails }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-3">Test ID</th>
            <th className="text-left p-3">Student</th>
            <th className="text-left p-3">Test Name</th>
            <th className="text-left p-3">Test Series</th>
            <th className="text-left p-3">Subject</th>
            <th className="text-center p-3">Score</th>
            <th className="text-center p-3">Evaluated On</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((evaluation) => (
            <tr key={evaluation.id} className="border-b">
              <td className="p-3 font-medium">{evaluation.id}</td>
              <td className="p-3">{evaluation.studentName}</td>
              <td className="p-3">{evaluation.testName}</td>
              <td className="p-3">{evaluation.testSeries}</td>
              <td className="p-3">{evaluation.subject}</td>
              <td className="p-3 text-center">
                <span className={`font-medium ${
                  evaluation.score >= 80 ? 'text-green-600' : 
                  evaluation.score >= 60 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {evaluation.score}/100
                </span>
              </td>
              <td className="p-3 text-center">
                {formatDate(evaluation.evaluatedOn)}
              </td>
              <td className="p-3 text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onViewDetails(evaluation)}
                >
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EvaluationsTable;
