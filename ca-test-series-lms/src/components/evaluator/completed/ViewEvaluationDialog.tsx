
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import { CompletedEvaluation } from '@/types/evaluation';

interface ViewEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: CompletedEvaluation | null;
  onUpdateFeedback: () => void;
}

const ViewEvaluationDialog: React.FC<ViewEvaluationDialogProps> = ({
  isOpen,
  onClose,
  evaluation,
  onUpdateFeedback,
}) => {
  if (!evaluation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Evaluation Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">{evaluation.testName}</h3>
            <p className="text-sm text-gray-500">{evaluation.testSeries}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-500">Student</p>
                <p className="font-medium">{evaluation.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium">{evaluation.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted On</p>
                <p>{new Date(evaluation.submittedOn).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluated On</p>
                <p>{new Date(evaluation.evaluatedOn).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Score</p>
                <p className={`font-medium ${
                  evaluation.score >= 80 ? 'text-green-600' : 
                  evaluation.score >= 60 ? 'text-blue-600' : 'text-red-600'
                }`}>{evaluation.score}/100</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Feedback</h3>
            <textarea 
              className="w-full p-2 border rounded min-h-[120px]"
              defaultValue={evaluation.feedback}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" /> View Answer PDF
            </Button>
            <Button variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" /> View Question Paper
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUpdateFeedback}>Update Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEvaluationDialog;
