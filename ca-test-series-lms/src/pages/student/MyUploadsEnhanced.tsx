import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Download,
  Eye,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import Navbar from "@/components/Navbar";
import FileUploadWithLimits from "@/components/shared/FileUploadWithLimits";
import { UPLOAD_CONFIGS } from "@/constants/uploadLimits";
import { formatDate } from "@/utils/dateUtils";

interface UploadItem {
  id: string;
  testName: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  evaluationStatus: "completed" | "under_review" | "pending";
  score: number | null;
  maxScore: number;
  evaluatorComments: string | null;
  hasSuggestedAnswers: boolean;
  suggestedAnswersFile: string | null;
}

const MyUploadsEnhanced = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [uploads, setUploads] = useState<UploadItem[]>([
    {
      id: "1",
      testName: "CA Foundation - Accounting Test Series 1",
      fileName: "accounting_answers.pdf",
      fileSize: "2.3 MB",
      uploadDate: "2023-10-15",
      evaluationStatus: "completed",
      score: 85,
      maxScore: 100,
      evaluatorComments:
        "Good understanding of fundamental concepts. Work on presentation.",
      hasSuggestedAnswers: true,
      suggestedAnswersFile: "suggested_answers_accounting.pdf",
    },
    {
      id: "2",
      testName: "CA Foundation - Business Law Test Series",
      fileName: "business_law_answers.pdf",
      fileSize: "1.8 MB",
      uploadDate: "2023-10-12",
      evaluationStatus: "completed",
      score: 78,
      maxScore: 100,
      evaluatorComments:
        "Clear explanations. Focus more on case law references.",
      hasSuggestedAnswers: true,
      suggestedAnswersFile: "suggested_answers_business_law.pdf",
    },
    {
      id: "3",
      testName: "CA Foundation - Mathematics Test Series",
      fileName: "mathematics_answers.pdf",
      fileSize: "2.7 MB",
      uploadDate: "2023-10-05",
      evaluationStatus: "under_review",
      score: null,
      maxScore: 100,
      evaluatorComments: null,
      hasSuggestedAnswers: true,
      suggestedAnswersFile: "suggested_answers_mathematics.pdf",
    },
  ]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Simulate API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const selectedFile = selectedFiles[0];

      // Mock upload logic
      const newUpload: UploadItem = {
        id: Date.now().toString(),
        testName: "New Test Upload",
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split("T")[0],
        evaluationStatus: "pending" as const,
        score: null,
        maxScore: 100,
        evaluatorComments: null,
        hasSuggestedAnswers: false,
        suggestedAnswersFile: null,
      };

      setUploads((prev) => [newUpload, ...prev]);

      toast({
        title: "File Uploaded Successfully",
        description:
          "Your answer sheet has been uploaded and is pending evaluation.",
      });

      // Reset form
      setSelectedFiles([]);
      setShowUploadDialog(false);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Evaluated</Badge>;
      case "under_review":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
        );
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = (id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
    toast({
      title: "File Deleted",
      description: "The file has been removed from your uploads.",
    });
  };

  const handleViewSuggestedAnswers = (fileName: string) => {
    toast({
      title: "Downloading File",
      description: `Downloading ${fileName}...`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <MobileSidebar
        role="student"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:ml-64">
        <Navbar />

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Uploads</h1>
            <p className="text-gray-600 mt-2">
              Manage your uploaded answer sheets and track evaluation status
            </p>
          </div>

          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Answer Sheets</span>
                </CardTitle>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Answer Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{upload.testName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{upload.fileName}</span>
                            <span>•</span>
                            <span>{upload.fileSize}</span>
                            <span>•</span>
                            <span>
                              Uploaded:{" "}
                              {formatDate(upload.uploadDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(upload.evaluationStatus)}
                        {upload.score !== null && (
                          <Badge variant="outline">
                            {upload.score}/{upload.maxScore}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {upload.evaluationStatus === "completed" &&
                      upload.evaluatorComments && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-800">
                                Evaluator Comments:
                              </h4>
                              <p className="text-blue-700 text-sm">
                                {upload.evaluatorComments}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Answer Sheet
                        </Button>

                        {upload.hasSuggestedAnswers &&
                          upload.suggestedAnswersFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewSuggestedAnswers(
                                  upload.suggestedAnswersFile!
                                )
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Suggested Answers
                            </Button>
                          )}
                      </div>

                      <div className="flex space-x-2">
                        {upload.evaluationStatus === "completed" && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Evaluation
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(upload.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {uploads.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No uploads yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload your answer sheets for evaluation.
                  </p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    Upload Answer Sheet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Enhanced Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Upload Answer Sheet</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <FileUploadWithLimits
              config={UPLOAD_CONFIGS.ANSWER_SHEET}
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              disabled={isUploading}
              customLabel="Choose answer sheet PDF"
            />

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedFiles([]);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyUploadsEnhanced;
