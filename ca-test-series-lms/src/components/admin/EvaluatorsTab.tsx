
import { useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import EvaluatorPerformance from './EvaluatorPerformance';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EvaluatorItem {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  assignedTests: number;
  completedTests: number;
  pendingTests: number;
  avgCompletionTime?: number;
  profileImage?: string | null;
  joinDate: string;
  status: string;
}

const defaultEvaluators: EvaluatorItem[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    specialization: ['Accounting', 'Taxation', 'Financial Reporting'],
    assignedTests: 78,
    completedTests: 65,
    pendingTests: 13,
    joinDate: '2023-01-15',
    status: 'active',
    profileImage: null,
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    specialization: ['Business Laws', 'Corporate and Other Laws'],
    assignedTests: 92,
    completedTests: 87,
    pendingTests: 5,
    joinDate: '2023-02-20',
    status: 'active',
    profileImage: null,
  },
  {
    id: '3',
    name: 'Amit Sharma',
    email: 'amit@example.com',
    specialization: ['Business Economics', 'Quantitative Aptitude', 'Indirect Tax Laws'],
    assignedTests: 64,
    completedTests: 48,
    pendingTests: 16,
    joinDate: '2023-03-10',
    status: 'inactive',
    profileImage: null,
  },
];

const EvaluatorsTab = ({ evaluators = defaultEvaluators }: { evaluators?: EvaluatorItem[] }) => {
  const [selectedEvaluator, setSelectedEvaluator] = useState<EvaluatorItem | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);
  const { toast } = useToast();

  const calculateCompletionRate = (evaluator: EvaluatorItem) => {
    if (evaluator.assignedTests === 0) return 0;
    return Math.round((evaluator.completedTests / evaluator.assignedTests) * 100);
  };

  const handleViewEvaluator = (evaluator: EvaluatorItem) => {
    setSelectedEvaluator(evaluator);
    setShowPerformance(true);
  };

  const handleAddEvaluator = () => {
    toast({
      title: "Add Evaluator",
      description: "This would open an add evaluator dialog in a real app.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Evaluators Management</CardTitle>
          <Button onClick={handleAddEvaluator}>
            <UserCheck className="h-4 w-4 mr-2" />
            Add Evaluator
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 pl-4">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Specialization</th>
                  <th className="text-right p-2">Assigned</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2">Completion %</th>
                  <th className="text-right p-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evaluators.map((evaluator) => (
                  <tr key={evaluator.id} className="border-b">
                    <td className="p-2 pl-4">{evaluator.name}</td>
                    <td className="p-2">{evaluator.email}</td>
                    <td className="p-2">
                      {evaluator.specialization?.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-pointer flex items-center">
                                {evaluator.specialization[0]}
                                {evaluator.specialization.length > 1 && (
                                  <Badge variant="secondary" className="ml-2">
                                    +{evaluator.specialization.length - 1} more
                                  </Badge>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{evaluator.specialization.join(', ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="text-right p-2">{evaluator.assignedTests}</td>
                    <td className="text-right p-2">{evaluator.completedTests}</td>
                    <td className="text-right p-2">
                      {calculateCompletionRate(evaluator)}%
                    </td>
                    <td className="text-right p-2 pr-4 space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEvaluator(evaluator)}
                      >
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Series</label>
                <select className="w-full p-2 border rounded">
                  <option>CA Foundation - Accounting Test Series 1</option>
                  <option>CA Foundation - Business Law Test Series</option>
                  <option>CA Intermediate - Advanced Accounting</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Evaluator</label>
                <select className="w-full p-2 border rounded">
                  <option>Rajesh Kumar</option>
                  <option>Priya Singh</option>
                  <option>Amit Sharma</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pending Submissions</label>
              <div className="h-48 border rounded p-2 overflow-y-auto">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Student {i + 1} - Submission Date: {formatDate(new Date())}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Assign Selected</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Performance Modal */}
      {selectedEvaluator && (
        <EvaluatorPerformance
          isOpen={showPerformance}
          onClose={() => setShowPerformance(false)}
          evaluator={selectedEvaluator}
        />
      )}
    </div>
  );
};

export default EvaluatorsTab;
