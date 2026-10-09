import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Calendar, Activity, Clock } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

interface EvaluatorPerformanceProps {
  isOpen: boolean;
  onClose: () => void;
  evaluator: {
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
  };
}

const EvaluatorPerformance: React.FC<EvaluatorPerformanceProps> = ({
  isOpen,
  onClose,
  evaluator
}) => {
  if (!evaluator) return null;

  // Mock completed evaluations data
  const completedEvaluations = Array(evaluator.completedTests).fill(0).map((_, i) => ({
    id: `EVAL${i+1}`,
    studentName: `Student ${i+1}`,
    testName: i % 2 === 0 ? 'CA Foundation - Accounting Test Series' : 'CA Foundation - Business Law Test Series',
    assignedDate: formatDate(Date.now() - (i + 1) * 86400000 * 2),
    completedDate: formatDate(Date.now() - (i + 1) * 86400000),
    score: Math.floor(Math.random() * 30) + 70,
    timeTaken: Math.floor(Math.random() * 48) + 24, // hours
  }));

  // Mock pending evaluations data
  const pendingEvaluations = Array(evaluator.pendingTests).fill(0).map((_, i) => ({
    id: `PEND${i+1}`,
    studentName: `Student ${i + 10}`,
    testName: i % 2 === 0 ? 'CA Foundation - Economics Test Series' : 'CA Intermediate - Advanced Accounting',
    assignedDate: formatDate(Date.now() - (i + 1) * 86400000),
    dueDate: formatDate(Date.now() + (i + 1) * 86400000),
  }));

  // Monthly performance data (mock)
  const monthlyPerformance = [
    { month: 'Jan', evaluations: 18 },
    { month: 'Feb', evaluations: 22 },
    { month: 'Mar', evaluations: 30 },
    { month: 'Apr', evaluations: 25 },
    { month: 'May', evaluations: evaluator.completedTests },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>Evaluator Performance</DialogTitle>
          <DialogDescription>
            View detailed performance metrics for {evaluator.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={evaluator.profileImage || ''} />
            <AvatarFallback>
              {evaluator.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{evaluator.name}</h3>
            <p className="text-sm text-muted-foreground">{evaluator.specialization.join(', ')}</p>
          </div>
          <Badge variant={evaluator.status === 'active' ? 'default' : 'secondary'} className="ml-auto">
            {evaluator.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Assigned Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluator.assignedTests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluator.completedTests}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((evaluator.completedTests / evaluator.assignedTests) * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">
              <Calendar className="h-4 w-4 mr-2" />
              Monthly Report
            </TabsTrigger>
            <TabsTrigger value="completed">
              <Activity className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Evaluation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
                  Bar Chart Placeholder: Monthly Evaluations
                </div>
                <div className="mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-center py-2">Evaluations</th>
                        <th className="text-right py-2">vs Previous</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyPerformance.slice().reverse().map((item, i) => (
                        <tr key={item.month} className={i < monthlyPerformance.length - 1 ? "border-b" : ""}>
                          <td className="py-2">{item.month}</td>
                          <td className="text-center py-2">{item.evaluations}</td>
                          <td className="text-right py-2">
                            {i < monthlyPerformance.length - 1 ? (
                              <Badge variant={item.evaluations > monthlyPerformance[monthlyPerformance.length - i - 2].evaluations ? "default" : "secondary"}>
                                {item.evaluations > monthlyPerformance[monthlyPerformance.length - i - 2].evaluations ? "↑" : "↓"} 
                                {Math.abs(item.evaluations - monthlyPerformance[monthlyPerformance.length - i - 2].evaluations)}
                              </Badge>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Test</th>
                    <th className="text-center p-2">Assigned</th>
                    <th className="text-center p-2">Completed</th>
                    <th className="text-center p-2">Score</th>
                    <th className="text-center p-2">Time Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEvaluations.slice(0, 5).map((evaluation) => (
                    <tr key={evaluation.id} className="border-b">
                      <td className="p-2">{evaluation.studentName}</td>
                      <td className="p-2">{evaluation.testName}</td>
                      <td className="p-2 text-center">{evaluation.assignedDate}</td>
                      <td className="p-2 text-center">{evaluation.completedDate}</td>
                      <td className="p-2 text-center">{evaluation.score}/100</td>
                      <td className="p-2 text-center">
                        {evaluation.timeTaken < 24 ? `${evaluation.timeTaken}h` : `${Math.floor(evaluation.timeTaken / 24)}d ${evaluation.timeTaken % 24}h`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {completedEvaluations.length > 5 && (
              <div className="flex justify-center mt-2">
                <Button variant="link" size="sm" className="flex items-center">
                  View All ({completedEvaluations.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Test</th>
                    <th className="text-center p-2">Assigned Date</th>
                    <th className="text-center p-2">Due Date</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="border-b">
                      <td className="p-2">{evaluation.studentName}</td>
                      <td className="p-2">{evaluation.testName}</td>
                      <td className="p-2 text-center">{evaluation.assignedDate}</td>
                      <td className="p-2 text-center">{evaluation.dueDate}</td>
                      <td className="p-2 text-center">
                        <Badge variant="secondary">Pending</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluatorPerformance;
