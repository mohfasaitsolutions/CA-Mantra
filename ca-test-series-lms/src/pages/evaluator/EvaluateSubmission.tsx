import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Menu,
  ArrowLeft,
  Download,
  Upload,
  FileText,
  Save,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { formatDate } from "@/utils/dateUtils";
import { useUpdateSubmissionStatus } from "@/lib/api/hooks";
import { evaluatorsApi } from "@/lib/api/evaluators";
import type { Submission } from "@/lib/api/evaluators";

const EvaluateSubmission = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [marksAwarded, setMarksAwarded] = useState("");
  const [feedback, setFeedback] = useState("");
  const [evaluatedFile, setEvaluatedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const updateSubmissionMutation = useUpdateSubmissionStatus();

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) return;

      try {
        const data = await evaluatorsApi.getSubmissionDetails(submissionId);
        setSubmission(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load submission details.",
          variant: "destructive",
        });
        navigate("/evaluator/pending");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId, navigate, toast]);

  const handleDownloadAnswerSheet = () => {
    const answerSheetUrl = submission?.answerSheetUrl;
    if (answerSheetUrl) {
      const link = document.createElement("a");
      link.href = answerSheetUrl;
      link.download = `answer-sheet-${submission.studentName || "student"}.pdf`;
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

  const handleDownloadSuggestedAnswer = () => {
    const suggestedAnswerUrl =
      submission?.suggestedAnswerUrl || submission?.answerPdfUrl;

    if (suggestedAnswerUrl) {
      const link = document.createElement("a");
      link.href = suggestedAnswerUrl;
      link.download = `suggested-answer-${submission.testName || "test"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Suggested answer is being downloaded.",
      });
    } else {
      toast({
        title: "File Not Available",
        description: "Suggested answer is not available for download.",
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

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submission) return;

    const totalMarks = submission.totalMarks || 0;
    const marksValue = parseInt(marksAwarded);

    if (!marksAwarded || isNaN(marksValue) || marksValue < 0) {
      toast({
        title: "Invalid Marks",
        description: "Please enter valid marks (must be a positive number).",
        variant: "destructive",
      });
      return;
    }

    if (marksValue > totalMarks) {
      toast({
        title: "Invalid Marks",
        description: `Marks cannot exceed ${totalMarks}`,
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
      formData.append("remarks", feedback);

      // Upload evaluated file and complete evaluation using proper API
      await evaluatorsApi.uploadEvaluatedFile(submission._id, formData);

      toast({
        title: "Evaluation Submitted",
        description: "The evaluation has been saved successfully.",
      });

      navigate("/evaluator/pending");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDaysAgo = (dateString: string) => {
    if (!dateString) return 0;

    try {
      const submissionDate = new Date(dateString);
      if (isNaN(submissionDate.getTime())) return 0;

      const diffTime = Math.abs(
        new Date().getTime() - submissionDate.getTime()
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error calculating days ago:", error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Evaluate Submission</h1>
        </div>

        <div className="flex flex-1">
          <div className="hidden lg:block">
            <Sidebar role="evaluator" />
          </div>
          <MobileSidebar
            role="evaluator"
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Loading submission details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Evaluate Submission</h1>
        </div>

        <div className="flex flex-1">
          <div className="hidden lg:block">
            <Sidebar role="evaluator" />
          </div>
          <MobileSidebar
            role="evaluator"
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          <main className="flex-1 p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Submission not found or you don't have permission to evaluate
                it.
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </div>
    );
  }

  const daysAgo = getDaysAgo(submission.submittedAt!);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Evaluate Submission</h1>
      </div>

      <div className="flex flex-1">
        <div className="hidden lg:block">
          <Sidebar role="evaluator" />
        </div>
        <MobileSidebar
          role="evaluator"
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/evaluator/pending")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pending Evaluations
            </Button>

            <h1 className="text-2xl font-bold text-gray-900">
              Evaluate Submission
            </h1>
          </div>

          <div className="space-y-6">
            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Student:</strong>{" "}
                      {submission.studentName || "Unknown Student"}
                    </p>
                    <p>
                      <strong>Student ID:</strong>{" "}
                      {submission.studentIdNumber || "-"}
                    </p>
                    <p>
                      <strong>Test:</strong> {submission.testName || "N/A"}
                    </p>
                    <p>
                      <strong>Subject:</strong> {submission.subject}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Total Marks:</strong> {submission.totalMarks || 0}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {submission.submittedAt
                        ? formatDate(submission.submittedAt)
                        : "Invalid Date"}
                    </p>
                    <div>
                      <strong>Days Ago:</strong>
                      <Badge
                        variant={daysAgo > 3 ? "destructive" : "secondary"}
                        className="ml-2"
                      >
                        {daysAgo} day{daysAgo !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleDownloadAnswerSheet}
                    disabled={!submission.answerSheetUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Answer Sheet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadSuggestedAnswer}
                    disabled={
                      !(submission.suggestedAnswerUrl || submission.answerPdfUrl)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Suggested Answer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                {(!submission.totalMarks || submission.totalMarks === 0) && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Warning: This test has no marks defined (totalMarks:{" "}
                      {submission.totalMarks || 0}). Please contact the
                      administrator to set proper total marks for this test.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="marks">
                      Marks Awarded (out of {submission.totalMarks || 0}) *
                    </Label>
                    <Input
                      id="marks"
                      type="number"
                      min="0"
                      max={submission.totalMarks}
                      value={marksAwarded}
                      onChange={(e) => setMarksAwarded(e.target.value)}
                      placeholder="Enter marks"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide detailed feedback to the student..."
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/evaluator/pending")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateSubmissionMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSubmissionMutation.isPending
                        ? "Submitting..."
                        : "Submit Evaluation"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EvaluateSubmission;
