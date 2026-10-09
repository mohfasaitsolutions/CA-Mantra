
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';

// Define proper types for our test data
interface TestSection {
  name: string;
  questions: number;
  marks: number;
}

interface BaseTest {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  level: string;
  isPurchased: boolean;
  attemptsUsed: number;
  attemptsTotal: number;
  evaluationStatus: 'evaluated' | 'pending' | 'not-attempted';
  sections: TestSection[];
  duration: string;
  totalMarks: number;
}

interface EvaluatedTest extends BaseTest {
  evaluationStatus: 'evaluated';
  score: number;
  submissionDate: string;
  evaluationDate: string;
}

interface PendingTest extends BaseTest {
  evaluationStatus: 'pending';
  submissionDate: string;
}

interface NotAttemptedTest extends BaseTest {
  evaluationStatus: 'not-attempted';
}

type Test = EvaluatedTest | PendingTest | NotAttemptedTest;

// Mock test data
const testData: Record<string, Test> = {
  '1': {
    id: '1',
    title: 'CA Foundation - Accounting Test Series 1',
    description: 'Comprehensive test covering all fundamental accounting principles and concepts.',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3',
    price: 499,
    level: 'Foundation',
    isPurchased: true,
    attemptsUsed: 1,
    attemptsTotal: 3,
    evaluationStatus: 'pending',
    submissionDate: '2023-05-10T14:30:00Z',
    sections: [
      { name: 'Accounting Fundamentals', questions: 25, marks: 40 },
      { name: 'Financial Statements', questions: 15, marks: 30 },
      { name: 'Accounting Standards', questions: 15, marks: 30 },
    ],
    duration: '3 hours',
    totalMarks: 100,
  },
  '2': {
    id: '2',
    title: 'CA Foundation - Business Law Test Series',
    description: 'Practice questions on contract law, partnership law and company law fundamentals.',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3',
    price: 599,
    level: 'Foundation',
    isPurchased: true,
    attemptsUsed: 0,
    attemptsTotal: 3,
    evaluationStatus: 'not-attempted',
    sections: [
      { name: 'Contract Law', questions: 20, marks: 35 },
      { name: 'Partnership Act', questions: 15, marks: 30 },
      { name: 'Company Law Basics', questions: 20, marks: 35 },
    ],
    duration: '3 hours',
    totalMarks: 100,
  },
  '3': {
    id: '3',
    title: 'CA Intermediate - Advanced Accounting',
    description: 'In-depth test series for advanced accounting concepts for Intermediate students.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3',
    price: 799,
    level: 'Intermediate',
    isPurchased: true,
    attemptsUsed: 2,
    attemptsTotal: 3,
    evaluationStatus: 'evaluated',
    score: 78,
    submissionDate: '2023-05-01T10:15:00Z',
    evaluationDate: '2023-05-05T09:30:00Z',
    sections: [
      { name: 'Advanced Financial Accounting', questions: 20, marks: 35 },
      { name: 'Partnership Accounts', questions: 15, marks: 25 },
      { name: 'Company Accounts', questions: 20, marks: 40 },
    ],
    duration: '3 hours',
    totalMarks: 100,
  },
};

const TestDetailPage = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Get test details from mock data using testId
  const test = testData[testId as keyof typeof testData] || null;

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Test Not Found</h1>
            <p className="text-gray-600 mb-4">The test you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/test-series')}>Back to Test Series</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive"
      });
      return;
    }

    // Check if file is PDF
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid file format",
        description: "Only PDF files are accepted.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setUploading(false);
      toast({
        title: "Upload successful",
        description: "Your answer sheet has been uploaded successfully.",
      });
      navigate('/student/dashboard');
    }, 2000);
  };

  const handleDownload = () => {
    // In a real app, this would download the actual PDF
    toast({
      title: "Download started",
      description: "Your PDF is downloading...",
    });
  };

  const renderStatusBadge = () => {
    switch (test.evaluationStatus) {
      case 'evaluated':
        return (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Evaluated</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Pending Evaluation</span>
          </div>
        );
      case 'not-attempted':
        return (
          <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Not Attempted</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="content-container">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate('/test-series')} className="mb-4">
              &larr; Back to Test Series
            </Button>
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <h1 className="text-3xl font-bold">{test.title}</h1>
              {renderStatusBadge()}
            </div>
            <p className="text-gray-600 mt-2">{test.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Test Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Information</CardTitle>
                  <CardDescription>Details about the test and submission instructions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sections</h3>
                    <div className="space-y-2">
                      {test.sections.map((section, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span className="font-medium">{section.name}</span>
                          <div className="text-sm text-gray-600">
                            <span>{section.questions} Questions</span>
                            <span className="mx-2">•</span>
                            <span>{section.marks} Marks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold">{test.duration}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">Total Marks</p>
                      <p className="font-semibold">{test.totalMarks}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">CA Level</p>
                      <p className="font-semibold">{test.level}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-500">Attempts</p>
                      <p className="font-semibold">{test.attemptsUsed} of {test.attemptsTotal} used</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      <li>Download the question paper using the button on the right.</li>
                      <li>Write your answers on paper and scan them as a single PDF.</li>
                      <li>Ensure your name and registration number are on each page.</li>
                      <li>Upload your answer sheet using the upload button.</li>
                      <li>Once uploaded, your paper will be sent for evaluation.</li>
                      <li>Results will be available in your dashboard after evaluation.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {test.evaluationStatus === 'evaluated' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Result</CardTitle>
                    <CardDescription>Your performance in this test</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-gray-500 text-sm mb-1">Score</div>
                          <div className="text-3xl font-bold text-ca-primary">
                            {(test as EvaluatedTest).score}<span className="text-lg font-normal text-gray-500">/100</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-gray-500 text-sm mb-1">Submitted On</div>
                          <div className="font-medium">
                            {formatDate((test as EvaluatedTest | PendingTest).submissionDate)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-gray-500 text-sm mb-1">Evaluated On</div>
                          <div className="font-medium">
                            {formatDate((test as EvaluatedTest).evaluationDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button onClick={() => navigate(`/student/test/${test.id}/analysis`)}>
                          View Detailed Analysis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right Column - Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Actions</CardTitle>
                  <CardDescription>Download and submission options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleDownload} className="w-full" variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> Download Question Paper
                  </Button>
                  
                  {(test.evaluationStatus === 'not-attempted' || test.attemptsUsed < test.attemptsTotal) && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm font-medium">Upload Your Answer Sheet (PDF)</p>
                          <p className="text-xs text-gray-500 mt-1">Only PDF files are accepted</p>
                          
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept="application/pdf"
                            onChange={handleFileChange}
                          />
                          <label htmlFor="file-upload">
                            <Button variant="outline" className="mt-4" asChild>
                              <span>Select File</span>
                            </Button>
                          </label>
                        </div>
                        
                        {selectedFile && (
                          <div className="mt-4 p-2 bg-gray-50 rounded flex items-center justify-between">
                            <div className="truncate text-sm">{selectedFile.name}</div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-500"
                              onClick={() => setSelectedFile(null)}
                            >
                              &times;
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleUpload} 
                        disabled={!selectedFile || uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload Answer Sheet'}
                      </Button>
                    </div>
                  )}
                  
                  {test.evaluationStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm text-yellow-800">
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>Evaluation in Progress</span>
                      </div>
                      <p className="mt-1 text-xs">
                        Your submission is currently being evaluated by our experts. Results will be available soon.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {test.evaluationStatus !== 'not-attempted' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submission History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Submission Date:</span>
                        <span className="font-medium">
                          {formatDate((test as EvaluatedTest | PendingTest).submissionDate)}
                        </span>
                      </div>
                      
                      {test.evaluationStatus === 'evaluated' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Evaluation Date:</span>
                          <span className="font-medium">
                            {formatDate((test as EvaluatedTest).evaluationDate)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">
                          {test.evaluationStatus === 'evaluated' ? 'Evaluated' : 'Pending Evaluation'}
                        </span>
                      </div>
                      
                      {test.evaluationStatus === 'evaluated' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium">{(test as EvaluatedTest).score}/100</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TestDetailPage;
