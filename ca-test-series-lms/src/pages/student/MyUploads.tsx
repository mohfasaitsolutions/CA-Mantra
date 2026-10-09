import React, { useState } from 'react';
import { Menu, Upload, FileText, Eye, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { STATUS_COLORS } from '@/constants/colors';
import { formatDate } from '@/utils/dateUtils';

const MyUploads = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const { toast } = useToast();

  // Mock uploads data with suggested answers
  const [uploads, setUploads] = useState([
    {
      id: '1',
      testName: 'CA Foundation - Accounting Test Series 1',
      fileName: 'accounting_answers.pdf',
      fileSize: '2.3 MB',
      uploadDate: '2023-10-15',
      evaluationStatus: 'completed',
      score: 85,
      maxScore: 100,
      evaluatorComments: 'Good understanding of fundamental concepts. Work on presentation.',
      hasSuggestedAnswers: true,
      suggestedAnswersFile: 'suggested_answers_accounting.pdf',
    },
    {
      id: '2',
      testName: 'CA Foundation - Business Law Test Series',
      fileName: 'business_law_answers.pdf',
      fileSize: '1.8 MB',
      uploadDate: '2023-10-12',
      evaluationStatus: 'completed',
      score: 78,
      maxScore: 100,
      evaluatorComments: 'Clear explanations. Focus more on case law references.',
      hasSuggestedAnswers: true,
      suggestedAnswersFile: 'suggested_answers_business_law.pdf',
    },
    {
      id: '3',
      testName: 'CA Foundation - Economics Test Series',
      fileName: 'economics_answers.pdf',
      fileSize: '3.1 MB',
      uploadDate: '2023-10-08',
      evaluationStatus: 'pending',
      score: null,
      maxScore: 100,
      evaluatorComments: null,
      hasSuggestedAnswers: false,
      suggestedAnswersFile: null,
    },
    {
      id: '4',
      testName: 'CA Foundation - Mathematics Test Series',
      fileName: 'math_answers.pdf',
      fileSize: '2.7 MB',
      uploadDate: '2023-10-05',
      evaluationStatus: 'under_review',
      score: null,
      maxScore: 100,
      evaluatorComments: null,
      hasSuggestedAnswers: true,
      suggestedAnswersFile: 'suggested_answers_mathematics.pdf',
    },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed.');
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setUploadError('File size must be less than 5MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    // Mock upload logic
    const newUpload = {
      id: Date.now().toString(),
      testName: 'New Test Upload',
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      evaluationStatus: 'pending' as const,
      score: null,
      maxScore: 100,
      evaluatorComments: null,
      hasSuggestedAnswers: false,
      suggestedAnswersFile: null,
    };

    setUploads(prev => [newUpload, ...prev]);
    
    toast({
      title: "File Uploaded Successfully",
      description: "Your answer sheet has been uploaded and is pending evaluation.",
    });

    // Reset form
    setSelectedFile(null);
    setShowUploadDialog(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className={STATUS_COLORS.EVALUATED}>Evaluated</Badge>;
      case 'under_review':
        return <Badge className={STATUS_COLORS.UNDER_REVIEW}>Under Review</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewSuggestedAnswers = (fileName: string) => {
    toast({
      title: "Opening Suggested Answers",
      description: `Opening ${fileName} for reference.`,
    });
    // In a real app, this would open the suggested answers PDF
  };

  const handleDelete = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
    toast({
      title: "Upload Deleted",
      description: "The uploaded file has been successfully deleted.",
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
      
      <div className="flex-1">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">My Uploads</h1>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Answer Sheet
            </Button>
          </div>
        </header>
        
        <main className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uploads.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Evaluated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {uploads.filter(u => u.evaluationStatus === 'completed').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {uploads.filter(u => u.evaluationStatus === 'pending').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {uploads.filter(u => u.score).length > 0 
                    ? Math.round(uploads.filter(u => u.score).reduce((acc, u) => acc + (u.score || 0), 0) / uploads.filter(u => u.score).length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Uploads List */}
          <Card>
            <CardHeader>
              <CardTitle>Answer Sheet Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div key={upload.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{upload.testName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{upload.fileName}</span>
                            <span>•</span>
                            <span>{upload.fileSize}</span>
                            <span>•</span>
                            <span>Uploaded: {formatDate(upload.uploadDate)}</span>
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

                    {upload.evaluationStatus === 'completed' && upload.evaluatorComments && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">Evaluator Comments:</h4>
                            <p className="text-blue-700 text-sm">{upload.evaluatorComments}</p>
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
                        
                        {upload.hasSuggestedAnswers && upload.suggestedAnswersFile && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewSuggestedAnswers(upload.suggestedAnswersFile!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Suggested Answers
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {upload.evaluationStatus === 'completed' && (
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No uploads yet</h3>
                  <p className="text-gray-600 mb-4">Upload your answer sheets for evaluation.</p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    Upload Answer Sheet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Upload Answer Sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 min-w-0">
                  <p className="font-medium mb-1">Upload Requirements:</p>
                  <ul className="space-y-1 text-xs break-words">
                    <li>• File format: PDF only</li>
                    <li>• Maximum file size: 5MB</li>
                    <li>• Ensure all pages are clearly visible</li>
                    <li>• One file per test submission</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Answer Sheet (PDF)</label>
              <div className="border rounded-md p-4 flex flex-col items-center justify-center bg-gray-50">
                <Upload className="h-8 w-8 text-gray-400 mb-2 flex-shrink-0" />
                {selectedFile ? (
                  <div className="text-center w-full">
                    <p className="text-sm font-medium truncate px-2" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    Choose PDF file (Max 5MB)
                  </p>
                )}
                <input 
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="mt-2">
                  <Button type="button" variant="outline" size="sm">
                    Choose File
                  </Button>
                </label>
              </div>
              {uploadError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !!uploadError}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyUploads;
