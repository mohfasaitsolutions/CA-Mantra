
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Student {
    id: string;
    name: string;
    email: string;
    caLevel: string;
    recentTests: Test[];
}

interface Test {
    id: string;
    testName: string;
    dateAttempted: string;
    score: number;
    status: string;
    evaluatorName: string | null;
}

interface StudentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onGrantRetake: (testId: string) => void;
}

const StudentDetailsDialog: React.FC<StudentDetailsDialogProps> = ({ isOpen, onClose, student, onGrantRetake }) => {
  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-gray-500">Full Name</h3>
              <p>{student.name}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-500">Email</h3>
              <p>{student.email}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-500">CA Level</h3>
              <p>{student.caLevel}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-gray-500">Registration Date</h3>
              <p>May 1, 2023</p>
            </div>
          </div>
          
          <Tabs defaultValue="tests">
            <TabsList>
              <TabsTrigger value="tests">Test History</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tests" className="space-y-4 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">Test Name</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Evaluator</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-center p-2">Score</th>
                      <th className="text-right p-2">Grant Retake</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.recentTests.map((test) => (
                      <tr key={test.id} className="border-b">
                        <td className="p-2">{test.testName}</td>
                        <td className="p-2">{test.dateAttempted}</td>
                        <td className="p-2">{test.evaluatorName || 'Not Assigned'}</td>
                        <td className="p-2 text-center">
                          <Badge className={`inline-block px-2 py-1 text-xs ${
                            test.status === 'Evaluated' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}>
                            {test.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">{test.status === 'Evaluated' ? `${test.score}/100` : '-'}</td>
                        <td className="p-2 text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onGrantRetake(test.id)}
                          >
                            Grant Retake
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="purchases" className="space-y-4 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2">Item</th>
                      <th className="text-left p-2">Purchase Date</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">CA Foundation Complete Package</td>
                      <td className="p-2">May 1, 2023</td>
                      <td className="p-2 text-right">₹2,999</td>
                      <td className="p-2 text-center">
                        <Badge className="bg-green-500">
                          Completed
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StudentDetailsDialog;
