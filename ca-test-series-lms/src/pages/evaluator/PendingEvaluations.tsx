import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Eye,
  Clock,
  AlertTriangle,
  AlertCircle,
  UserPlus,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEvaluatorQueue, useUpdateSubmissionStatus } from "@/lib/api/hooks";
import type { Submission, SUBMISSION_STATUS } from "@/lib/api/evaluators";

const PendingEvaluations = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    data: pendingEvaluations,
    isLoading,
    error,
    refetch,
  } = useEvaluatorQueue(); // Show all submissions matching specialization

  const updateSubmissionMutation = useUpdateSubmissionStatus();

  const handleStartEvaluation = async (submission: Submission) => {
    try {
      await updateSubmissionMutation.mutateAsync({
        submissionId: submission._id,
        payload: { action: "start" },
      });

      toast({
        title: "Evaluation Started",
        description: "You have started evaluating this submission.",
        duration: 3000,
      });

      // Navigate to the evaluation page
      navigate(`/evaluator/evaluate/${submission._id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClaimSubmission = async (submission: Submission) => {
    try {
      await updateSubmissionMutation.mutateAsync({
        submissionId: submission._id,
        payload: { action: "claim" },
      });

      toast({
        title: "Submission Claimed",
        description: "You have successfully claimed this submission.",
        duration: 3000,
      });

      refetch(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLockSubmission = async (submissionId: string) => {
    try {
      await updateSubmissionMutation.mutateAsync({
        submissionId,
        payload: { action: "lock" },
      });

      toast({
        title: "Submission Locked",
        description: "This submission has been locked for evaluation.",
        duration: 3000,
      });

      refetch(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockSubmission = async (submissionId: string) => {
    try {
      await updateSubmissionMutation.mutateAsync({
        submissionId,
        payload: { action: "unlock" },
      });

      toast({
        title: "Submission Unlocked",
        description: "This submission has been unlocked and is now available.",
        duration: 3000,
      });

      refetch(); // Refresh the list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to unlock submission";
      toast({
        title: "Cannot Unlock",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const getDaysAgo = (dateString: string | undefined) => {
    if (!dateString) return 0;
    const submissionDate = new Date(dateString);
    if (isNaN(submissionDate.getTime())) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="evaluator" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading pending evaluations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="evaluator" />
        <div className="flex-1 p-6">
          <Alert className="max-w-md mx-auto mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load pending evaluations. Please try refreshing the
              page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const evaluations = pendingEvaluations || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="evaluator" />
      <MobileSidebar
        role="evaluator"
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
              <h1 className="text-2xl font-bold text-gray-800">
                Subjective Test Evaluations
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </header>

        <main className="p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Subjective Tests for Evaluation ({evaluations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Only subjective tests appear here for manual evaluation.
                Objective tests are automatically evaluated upon submission and
                do not require evaluator intervention.
              </p>
            </CardContent>
          </Card>

          {evaluations.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium">
                          Submission ID
                        </th>
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium">Test Name</th>
                        <th className="text-left p-4 font-medium">Subject</th>
                        <th className="text-left p-4 font-medium">
                          Total Marks
                        </th>
                        <th className="text-center p-4 font-medium">
                          Submitted
                        </th>
                        <th className="text-center p-4 font-medium">Status</th>
                        <th className="text-right p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <TooltipProvider>
                        {evaluations.map((evaluation) => {
                          const submissionDate = evaluation.submittedAt || evaluation.createdAt;
                          const daysAgo = getDaysAgo(submissionDate);
                          const isUrgent = daysAgo > 3;

                          return (
                            <tr
                              key={evaluation._id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-4 font-medium font-mono text-sm">
                                {evaluation._id.slice(-8)}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {isUrgent && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{`${daysAgo} days pending`}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  <span className="font-medium">
                                    {evaluation.studentName ||
                                      "Unknown Student"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-gray-900">
                                  {evaluation.testName || "Test Name Not Available"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {evaluation.testType || "Subjective Test"}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {evaluation.subject}
                                </span>
                              </td>
                              <td className="p-4 font-medium">
                                {evaluation.totalMarks}
                              </td>
                              <td className="text-center p-4">
                                <div className="text-sm">
                                  {formatDate(
                                    submissionDate
                                  )}
                                  <div
                                    className={`text-xs ${
                                      isUrgent
                                        ? "text-red-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {daysAgo} day{daysAgo !== 1 ? "s" : ""} ago
                                  </div>
                                </div>
                              </td>
                              <td className="text-center p-4">
                                {evaluation.evaluatorId ? (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Assigned
                                  </Badge>
                                ) : evaluation.status ===
                                  ("LOCKED" as SUBMISSION_STATUS) ? (
                                  <Badge className="bg-red-100 text-red-800">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Available
                                  </Badge>
                                )}
                              </td>
                              <td className="text-right p-4">
                                <div className="flex justify-end gap-2">
                                  {evaluation.evaluatorId ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleStartEvaluation(evaluation)
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={
                                          updateSubmissionMutation.isPending
                                        }
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Start Evaluation
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleUnlockSubmission(evaluation._id)
                                        }
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                        disabled={
                                          updateSubmissionMutation.isPending
                                        }
                                      >
                                        <Unlock className="h-3 w-3 mr-1" />
                                        Unlock
                                      </Button>
                                    </>
                                  ) : evaluation.status ===
                                    ("LOCKED" as SUBMISSION_STATUS) ? (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUnlockSubmission(evaluation._id)
                                      }
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                      disabled={
                                        updateSubmissionMutation.isPending
                                      }
                                    >
                                      <Unlock className="h-3 w-3 mr-1" />
                                      Unlock
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleClaimSubmission(evaluation)
                                        }
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={
                                          updateSubmissionMutation.isPending
                                        }
                                      >
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Claim
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleLockSubmission(evaluation._id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={
                                          updateSubmissionMutation.isPending
                                        }
                                      >
                                        <Lock className="h-3 w-3 mr-1" />
                                        Lock
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </TooltipProvider>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No subjective tests to evaluate
              </h3>
              <p className="text-gray-600 mb-2">
                All subjective tests have been evaluated or are currently in
                progress.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Only subjective tests appear here. Objective tests are
                automatically evaluated.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                Check for New Evaluations
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PendingEvaluations;
