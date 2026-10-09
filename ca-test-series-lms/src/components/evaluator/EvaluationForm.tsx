import React, { useState } from "react";
import { Download, Save, Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EvaluationFormProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: {
    id: number;
    studentName: string;
    testName: string;
    subject: string;
    maxMarks: number;
    answerPdfUrl?: string;
    questionPaperUrl?: string;
    expectedAnswersheetUrl?: string;
  };
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  isOpen,
  onClose,
  evaluation,
}) => {
  const [marksAwarded, setMarksAwarded] = useState("");
  const [feedback, setFeedback] = useState("");
  const [evaluatedFile, setEvaluatedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!marksAwarded || parseInt(marksAwarded) > evaluation.maxMarks) {
      toast({
        title: "Invalid Marks",
        description: `Marks cannot exceed ${evaluation.maxMarks}`,
        variant: "destructive",
      });
      return;
    }

    if (!evaluatedFile) {
      toast({
        title: "Missing File",
        description: "Please upload the evaluated answer sheet.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("evaluatedFile", evaluatedFile);
      formData.append("marksAwarded", marksAwarded);
      formData.append("feedback", feedback);
      formData.append("submissionId", evaluation.id.toString());

      // Here you would make an API call to submit the evaluation
      // await evaluatorApi.submitEvaluation(formData);

      toast({
        title: "Evaluation Submitted",
        description: "The evaluation has been saved successfully.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQuestion = () => {
    if (evaluation.questionPaperUrl) {
      const link = document.createElement("a");
      link.href = evaluation.questionPaperUrl;
      link.download = `question-paper-${evaluation.testName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Question paper is being downloaded.",
      });
    } else {
      toast({
        title: "File Not Available",
        description: "Question paper is not available for download.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAnswer = () => {
    if (evaluation.answerPdfUrl) {
      const link = document.createElement("a");
      link.href = evaluation.answerPdfUrl;
      link.download = `answer-sheet-${evaluation.studentName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Student's answer sheet is being downloaded.",
      });
    } else {
      toast({
        title: "File Not Available",
        description: "Answer sheet is not available for download.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExpectedAnswer = () => {
    if (evaluation.expectedAnswersheetUrl) {
      const link = document.createElement("a");
      link.href = evaluation.expectedAnswersheetUrl;
      link.download = `expected-answers-${evaluation.testName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Expected answer sheet is being downloaded.",
      });
    } else {
      toast({
        title: "File Not Available",
        description: "Expected answer sheet is not available.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File size (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB) exceeds 20MB limit. Please upload a smaller PDF file.`,
          variant: "destructive",
        });
        return;
      }

      setEvaluatedFile(file);
      toast({
        title: "File Selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluate Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Student:</strong> {evaluation.studentName}
                  </p>
                  <p>
                    <strong>Test:</strong> {evaluation.testName}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Subject:</strong> {evaluation.subject}
                  </p>
                  <p>
                    <strong>Maximum Marks:</strong> {evaluation.maxMarks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={handleDownloadQuestion}>
                <Download className="h-4 w-4 mr-2" />
                Download Question Paper
              </Button>
              <Button variant="outline" onClick={handleDownloadAnswer}>
                <Download className="h-4 w-4 mr-2" />
                Download Answer Sheet
              </Button>
              <Button variant="outline" onClick={handleDownloadExpectedAnswer}>
                <Download className="h-4 w-4 mr-2" />
                Download Expected Answers
              </Button>
            </CardContent>
          </Card>

          {/* Evaluation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="marks">
                    Marks Awarded (out of {evaluation.maxMarks})
                  </Label>
                  <Input
                    id="marks"
                    type="number"
                    min="0"
                    max={evaluation.maxMarks}
                    value={marksAwarded}
                    onChange={(e) => setMarksAwarded(e.target.value)}
                    placeholder="Enter marks"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={4}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="evaluatedFile">
                    Upload Evaluated Answer Sheet *
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      id="evaluatedFile"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="evaluatedFile"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {evaluatedFile
                          ? evaluatedFile.name
                          : "Click to upload evaluated answer sheet (PDF only)"}
                      </span>
                      <span className="text-xs text-gray-400">
                        Maximum file size: 10MB
                      </span>
                    </label>
                  </div>
                  {evaluatedFile && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span>File ready for upload: {evaluatedFile.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Submit Evaluation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationForm;
