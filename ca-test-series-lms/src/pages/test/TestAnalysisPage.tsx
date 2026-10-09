import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Download,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { studentsApi, SubmissionDetails } from "@/lib/api/students";
import { formatDate } from "@/utils/dateUtils";
import MathText from "@/components/shared/MathText";

const TestAnalysisPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submission details
  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await studentsApi.getSubmissionDetails(id);
        setSubmission(data);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to fetch submission details:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load test analysis";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [id]);

  // Download file handler
  const handleDownload = (url: string, filename: string) => {
    if (!url) {
      toast({
        title: "File Not Available",
        description: "The requested file is not available for download.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: `Downloading ${filename}`,
    });
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        if (submission?.isAutoEvaluated) {
          return (
            <Badge className="bg-green-100 text-green-800">
              ✅ Auto-evaluated
            </Badge>
          );
        }
        return (
          <Badge className="bg-green-100 text-green-800">
            Evaluation Complete
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Evaluation
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Evaluation In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">Unknown Status</Badge>
        );
    }
  };

  // Render objective test analysis
  const renderObjectiveAnalysis = () => {
    if (
      !submission?.questionAnalysis ||
      submission.questionAnalysis.length === 0
    ) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Detailed question-wise analysis is not available for this test.
              </p>
              <p className="text-sm text-gray-500">
                This may be an older submission that was submitted before the
                detailed analysis feature was implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const totalQuestions = submission.questionAnalysis.length;
    const correctAnswers = submission.questionAnalysis.filter(
      (q) => q.isCorrect
    ).length;
    const incorrectAnswers = submission.questionAnalysis.filter(
      (q) => !q.isCorrect && q.studentAnswer
    ).length;
    const unattempted = submission.questionAnalysis.filter(
      (q) => !q.studentAnswer
    ).length;

    return (
      <div className="space-y-6">
        {/* Questions Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Performance Bar */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Question-wise Performance
                </h3>
                <p className="text-sm text-gray-600">
                  {correctAnswers} out of {totalQuestions} questions answered
                  correctly
                </p>
              </div>

              <div className="h-8 flex rounded-full overflow-hidden mb-4 border-2 border-gray-200">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{
                    width: `${(correctAnswers / totalQuestions) * 100}%`,
                  }}
                ></div>
                <div
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{
                    width: `${(incorrectAnswers / totalQuestions) * 100}%`,
                  }}
                ></div>
                <div
                  className="bg-gray-300 h-full transition-all duration-500"
                  style={{ width: `${(unattempted / totalQuestions) * 100}%` }}
                ></div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Correct
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {correctAnswers}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((correctAnswers / totalQuestions) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Incorrect
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {incorrectAnswers}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((incorrectAnswers / totalQuestions) * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Circle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Unattempted
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">
                    {unattempted}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((unattempted / totalQuestions) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Accuracy Rate
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {correctAnswers + incorrectAnswers > 0
                        ? (
                          (correctAnswers /
                            (correctAnswers + incorrectAnswers)) *
                          100
                        ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Attempt Rate
                    </div>
                    <div className="text-lg font-bold text-purple-600">
                      {(
                        ((correctAnswers + incorrectAnswers) / totalQuestions) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Marks Scored
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {submission?.score || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Success Rate
                    </div>
                    <div className="text-lg font-bold text-ca-primary">
                      {((correctAnswers / totalQuestions) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question-wise Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Question-wise Analysis
              <Badge variant="outline" className="text-xs">
                {submission.questionAnalysis.length} Questions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {submission.questionAnalysis.map((question, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${question.isCorrect
                      ? "border-green-200 bg-green-50/30"
                      : question.studentAnswer
                        ? "border-red-200 bg-red-50/30"
                        : "border-gray-200 bg-gray-50/30"
                    }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${question.isCorrect
                            ? "bg-green-500 text-white"
                            : question.studentAnswer
                              ? "bg-red-500 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                      >
                        {question.questionIndex + 1}
                      </div>

                      <div className="flex items-center gap-2">
                        {question.studentAnswer ? (
                          question.isCorrect ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-700 font-medium text-sm">
                                Correct
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-red-700 font-medium text-sm">
                                Incorrect
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1">
                            <Circle className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600 font-medium text-sm">
                              Not Attempted
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${question.isCorrect ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {question.marksAwarded}
                        <span className="text-gray-500 font-normal">
                          /{question.maxMarks}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">marks</div>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4 p-3 bg-white rounded border">
                    <p className="text-sm font-medium leading-relaxed">
                      <MathText text={question.questionText} />
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      Options:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(question.options).map(([key, value]) => {
                        const isCorrectOption = key === question.correctAnswer;
                        const isStudentOption = key === question.studentAnswer;

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 transition-all ${isCorrectOption
                                ? "bg-green-100 border-green-300"
                                : isStudentOption && !question.isCorrect
                                  ? "bg-red-100 border-red-300"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrectOption
                                    ? "bg-green-500 text-white"
                                    : isStudentOption && !question.isCorrect
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-300 text-gray-600"
                                  }`}
                              >
                                {key}
                              </div>

                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">
                                  <MathText text={value as string} />
                                </p>

                                <div className="flex items-center gap-3 mt-2">
                                  {isCorrectOption && (
                                    <Badge className="bg-green-500 text-white text-xs">
                                      ✓ Correct Answer
                                    </Badge>
                                  )}
                                  {isStudentOption && (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${question.isCorrect
                                          ? "border-green-500 text-green-700"
                                          : "border-red-500 text-red-700"
                                        }`}
                                    >
                                      Your Choice
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Answer Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                          Correct Answer:
                          <span className="ml-1 font-bold text-green-600">
                            {question.correctAnswer}){" "}
                            <MathText text={question.options[question.correctAnswer]} />
                          </span>
                        </span>
                      </div>

                      {question.studentAnswer && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Your Answer:</span>
                          <span
                            className={`font-bold ${question.isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                              }`}
                          >
                            {question.studentAnswer}){" "}
                            <MathText text={question.options[question.studentAnswer]} />
                          </span>
                        </div>
                      )}

                      {!question.studentAnswer && (
                        <span className="text-gray-500 italic">
                          Not attempted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render subjective test information
  const renderSubjectiveAnalysis = () => {
    return (
      <div className="space-y-6">
        {/* Evaluation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Evaluator:</span>
                  <span className="font-medium">
                    {submission?.isAutoEvaluated
                      ? "Auto-evaluated"
                      : submission?.evaluatorName || "Pending"}
                  </span>
                  {submission?.isAutoEvaluated && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Instant
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="font-medium">
                    {submission?.submittedAt
                      ? formatDate(submission.submittedAt)
                      : "N/A"}
                  </span>
                </div>

                {submission?.evaluatedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Evaluated:</span>
                    <span className="font-medium">
                      {formatDate(submission.evaluatedAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="mt-1">
                    {renderStatusBadge(submission?.status || "")}
                  </div>
                </div>

                {submission?.score !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">Score:</span>
                    <div className="text-2xl font-bold text-ca-primary mt-1">
                      {submission.score}
                      <span className="text-lg font-normal text-gray-500">
                        /{submission.totalMarks}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {submission?.remarks && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Evaluator Remarks:
                </h4>
                <p className="text-blue-800">{submission.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Downloads */}
        <Card>
          <CardHeader>
            <CardTitle>Files & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {submission?.questionPaperUrl && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownload(
                      submission.questionPaperUrl!,
                      `question-paper-${submission.testName}.pdf`
                    )
                  }
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Question Paper
                </Button>
              )}

              {submission?.submissionFileUrl && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownload(
                      submission.submissionFileUrl!,
                      `your-answers-${submission.testName}.pdf`
                    )
                  }
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Your Answers
                </Button>
              )}

              {submission?.answerPdfUrl && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownload(
                      submission.answerPdfUrl!,
                      `suggested-answers-${submission.testName}.pdf`
                    )
                  }
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Suggested Answers
                </Button>
              )}

              {submission?.evaluatedFileUrl && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDownload(
                      submission.evaluatedFileUrl!,
                      `evaluated-answers-${submission.testName}.pdf`
                    )
                  }
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Evaluated Sheet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ca-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test analysis...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Analysis Not Found</h1>
            <p className="text-gray-600 mb-4">
              {error ||
                "The test analysis you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate("/student/history")}>
              Back to Test History
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow py-8">
        <div className="content-container">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/student/history")}
              className="mb-4"
            >
              &larr; Back to Test History
            </Button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {submission.testName} - Analysis
                </h1>
                <p className="text-gray-600 mt-2">
                  Test submitted on{" "}
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
              {renderStatusBadge(submission.status)}
            </div>
          </div>

          {/* Performance Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-gray-500 text-sm mb-1">Test Type</div>
                  <div className="text-lg font-bold capitalize">
                    {submission.testType.toLowerCase()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-gray-500 text-sm mb-1">Subject</div>
                  <div className="text-lg font-bold">{submission.subject}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-gray-500 text-sm mb-1">Total Marks</div>
                  <div className="text-lg font-bold">
                    {submission.totalMarks}
                  </div>
                </div>

                {submission.score !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-gray-500 text-sm mb-1">Your Score</div>
                    <div className="text-2xl font-bold text-ca-primary">
                      {submission.score}
                      <span className="text-lg font-normal text-gray-500">
                        /{submission.totalMarks}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Type-specific Analysis */}
          {submission.testType === "OBJECTIVE" && submission.questionAnalysis
            ? renderObjectiveAnalysis()
            : renderSubjectiveAnalysis()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TestAnalysisPage;
