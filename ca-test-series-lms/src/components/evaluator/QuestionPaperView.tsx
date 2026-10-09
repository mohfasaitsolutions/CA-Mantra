
import React from 'react';
import { X, Download, ArrowLeft, ArrowRight, Maximize, Minimize } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QuestionPaperViewProps {
  isOpen: boolean;
  onClose: () => void;
  testData: {
    id: string;
    title: string;
    pdfUrl?: string;
  };
}

const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({
  isOpen,
  onClose,
  testData
}) => {
  const { toast } = useToast();
  const [fullscreen, setFullscreen] = React.useState(false);

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "The question paper is being downloaded.",
    });
    // In a real app, this would trigger a download of the PDF
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  if (!testData) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onClose}
    >
      <DialogContent className={`
        ${fullscreen ? "max-w-full h-screen m-0 rounded-none" : "sm:max-w-[700px]"}
      `}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Question Paper: {testData.title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className={`
          bg-gray-50 rounded border overflow-hidden
          ${fullscreen ? "flex-grow flex flex-col" : "h-[500px]"}
        `}>
          {testData.pdfUrl ? (
            <iframe 
              src={testData.pdfUrl} 
              title="Question Paper PDF"
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md">
                <h3 className="text-lg font-semibold mb-2">Sample Question Paper</h3>
                <p className="text-gray-600 mb-4">
                  This is where the actual PDF would be displayed. In a real application, 
                  the question paper PDF would be rendered here.
                </p>
                <div className="p-4 bg-gray-100 rounded mb-4 text-left">
                  <h4 className="font-medium mb-2">Question 1:</h4>
                  <p>Explain the concept of Accounting Standards with reference to their need and importance. (10 marks)</p>
                  
                  <h4 className="font-medium mb-2 mt-4">Question 2:</h4>
                  <p>Define the term 'Depreciation'. What are the causes of depreciation? Explain any three methods of providing depreciation. (10 marks)</p>
                  
                  <h4 className="font-medium mb-2 mt-4">Question 3:</h4>
                  <p>Explain the difference between Capital Expenditure and Revenue Expenditure with suitable examples. (10 marks)</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Page
            </Button>
            <span className="text-sm">Page 1 of 5</span>
            <Button variant="outline" size="sm">
              Next Page
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionPaperView;
