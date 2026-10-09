
import React, { useState } from 'react';
import { FileText, ArrowLeft, Check, RefreshCw } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface StudentTestDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  testData: any; // In a real app, this would have a proper type
}

const StudentTestDetails: React.FC<StudentTestDetailsProps> = ({
  isOpen,
  onClose,
  testData
}) => {
  const [feedback, setFeedback] = useState(testData?.feedback || '');
  const { toast } = useToast();

  const handleGrantRetake = () => {
    toast({
      title: "Retake Access Granted",
      description: `${testData?.studentName} has been granted access to retake this test.`,
    });
  };

  const handleUpdateFeedback = () => {
    toast({
      title: "Feedback Updated",
      description: "The feedback has been updated successfully.",
    });
  };

  // If testData is not provided, don't render anything
  if (!testData) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Evaluated':
        return <Badge className="bg-green-500">Evaluated</Badge>;
      case 'Pending Evaluation':
        return <Badge className="bg-yellow-500">Pending Evaluation</Badge>;
      case 'In Progress':
        return <Badge className="bg-primary">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Test Details</DialogTitle>
          <DialogDescription>
            Viewing details for {testData.testName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="answers">Student Answers</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Student Name</h3>
                <p>{testData.studentName}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500">Test Name</h3>
                <p>{testData.testName}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500">Date Attempted</h3>
                <p>{testData.dateAttempted}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500">Status</h3>
                <p>{getStatusBadge(testData.status)}</p>
              </div>

              {testData.status === 'Evaluated' && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Score</h3>
                    <p className="text-lg font-bold">{testData.score}/100</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Evaluator</h3>
                    <p>{testData.evaluator}</p>
                  </div>
                </>
              )}
            </div>

            {testData.status === 'Evaluated' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500">Performance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Overall</span>
                      <span>{testData.score}%</span>
                    </div>
                    <Progress value={testData.score} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Accuracy</span>
                      <span>{testData.accuracy || 75}%</span>
                    </div>
                    <Progress value={testData.accuracy || 75} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Completion</span>
                      <span>{testData.completion || 90}%</span>
                    </div>
                    <Progress value={testData.completion || 90} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="answers">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Student Answer PDF</span>
            </div>

            <div className="border rounded-md p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[200px]">
              <p className="text-gray-500 mb-2">
                Student answer sheet would be displayed here
              </p>
              <Button variant="outline" size="sm">
                Download Answer Sheet
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-4 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Question Paper</span>
            </div>

            <div className="border rounded-md p-4 bg-gray-50 flex flex-col items-center justify-center min-h-[200px]">
              <p className="text-gray-500 mb-2">
                Question paper would be displayed here
              </p>
              <Button variant="outline" size="sm">
                Download Question Paper
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Admin Feedback</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student"
                  rows={6}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdateFeedback}
                className="flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Update Feedback
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGrantRetake}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Grant Retake Access
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentTestDetails;
