import { useState } from "react";
import { Menu, AlertCircle, Download, FileText, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEvaluatorCompletedEvaluations } from "@/lib/api/hooks";
import type { Submission } from "@/lib/api/evaluators";
import { formatDate } from "@/utils/dateUtils";

// Component for displaying evaluation summary
const EvaluationSummary = ({
  completedEvaluations,
}: {
  completedEvaluations: Submission[];
}) => {
  const totalEvaluations = completedEvaluations.length;
  const thisWeek = completedEvaluations.filter((evaluation) => {
    const evalDate = new Date(evaluation.evaluatedAt || evaluation.updatedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return evalDate >= oneWeekAgo;
  }).length;

  const averageMarks =
    totalEvaluations > 0
      ? completedEvaluations.reduce(
          (sum, eval_) => sum + (eval_.awardedMarks || 0),
          0
        ) / totalEvaluations
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {totalEvaluations}
            </p>
            <p className="text-gray-600">Total Completed</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{thisWeek}</p>
            <p className="text-gray-600">This Week</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {averageMarks.toFixed(1)}
            </p>
            <p className="text-gray-600">Average Marks</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for filters
const EvaluationFilters = ({
  searchTerm,
  setSearchTerm,
  filterPeriod,
  setFilterPeriod,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterPeriod: string;
  setFilterPeriod: (period: string) => void;
}) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <input
      type="text"
      placeholder="Search evaluations..."
      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <select
      className="px-3 py-2 border border-gray-300 rounded-md"
      value={filterPeriod}
      onChange={(e) => setFilterPeriod(e.target.value)}
    >
      <option value="all">All Time</option>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
    </select>
  </div>
);

// Component for evaluations table
const EvaluationsTable = ({
  evaluations,
  onViewDetails,
}: {
  evaluations: Submission[];
  onViewDetails: (evaluation: Submission) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px]">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left p-4 font-medium whitespace-nowrap">Submission ID</th>
          <th className="text-left p-4 font-medium whitespace-nowrap">Test ID</th>
          <th className="text-left p-4 font-medium whitespace-nowrap">Subject</th>
          <th className="text-center p-4 font-medium whitespace-nowrap">Evaluated On</th>
          <th className="text-center p-4 font-medium whitespace-nowrap">Score</th>
          <th className="text-right p-4 font-medium whitespace-nowrap">Actions</th>
        </tr>
      </thead>
      <tbody>
        {evaluations.map((evaluation) => (
          <tr key={evaluation._id} className="border-b hover:bg-gray-50">
            <td className="p-4 font-mono text-sm whitespace-nowrap">
              {evaluation._id.slice(-8)}
            </td>
            <td className="p-4 font-mono text-sm whitespace-nowrap">
              {(() => {
                const testId = evaluation.testId;
                if (!testId) return "N/A";
                if (typeof testId === 'string') return testId.slice(-8);
                if (typeof testId === 'object' && (testId as any)._id) {
                  return String((testId as any)._id).slice(-8);
                }
                return String(testId).slice(-8);
              })()}
            </td>
            <td className="p-4 whitespace-nowrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {evaluation.subject}
              </span>
            </td>
            <td className="text-center p-4">
              {formatDate(
                evaluation.evaluatedAt || evaluation.updatedAt
              )}
            </td>
            <td className="text-center p-4">
              <span className="font-semibold">
                {evaluation.awardedMarks ?? "N/A"}/{evaluation.totalMarks}
              </span>
            </td>
            <td className="text-right p-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(evaluation)}
              >
                View Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// No evaluations component
const NoEvaluations = ({ isFiltering }: { isFiltering: boolean }) => (
  <div className="text-center py-12">
    <div className="h-16 w-16 text-gray-400 mx-auto mb-4">📊</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {isFiltering ? "No evaluations found" : "No completed evaluations"}
    </h3>
    <p className="text-gray-600">
      {isFiltering
        ? "Try adjusting your search or filter criteria."
        : "Completed evaluations will appear here once you finish evaluating submissions."}
    </p>
  </div>
);

const CompletedEvaluations = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const {
    data: completedEvaluations,
    isLoading,
    error,
    refetch,
  } = useEvaluatorCompletedEvaluations();

  const [selectedEvaluation, setSelectedEvaluation] = useState<Submission | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewEvaluation = (evaluation: Submission) => {
    setSelectedEvaluation(evaluation);
    setIsDetailsOpen(true);
  };

  // Filter evaluations based on search term and period
  const filteredEvaluations = (completedEvaluations || []).filter(
    (evaluation) => {
      // Filter by search term
      if (
        searchTerm &&
        !evaluation.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !evaluation._id.includes(searchTerm)
      ) {
        return false;
      }

      // Filter by period
      if (filterPeriod !== "all") {
        const evalDate = new Date(
          evaluation.evaluatedAt || evaluation.updatedAt
        );
        const now = new Date();

        switch (filterPeriod) {
          case "today":
            return evalDate.toDateString() === now.toDateString();
          case "week": {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return evalDate >= oneWeekAgo;
          }
          case "month": {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return evalDate >= oneMonthAgo;
          }
          default:
            return true;
        }
      }

      return true;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="evaluator" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">
              Loading completed evaluations...
            </p>
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
              Failed to load completed evaluations. Please try refreshing the
              page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
                Completed Evaluations
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
          <EvaluationSummary
            completedEvaluations={completedEvaluations || []}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Completed Evaluations</CardTitle>
              <EvaluationFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterPeriod={filterPeriod}
                setFilterPeriod={setFilterPeriod}
              />
            </CardHeader>
            <CardContent>
              {filteredEvaluations.length === 0 ? (
                <NoEvaluations
                  isFiltering={searchTerm !== "" || filterPeriod !== "all"}
                />
              ) : (
                <EvaluationsTable
                  evaluations={filteredEvaluations}
                  onViewDetails={handleViewEvaluation}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Evaluation Details Dialog */}
      {selectedEvaluation && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Evaluation Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Student & Test Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Student:</span>
                      <span className="font-medium">{selectedEvaluation.studentName || "Unknown"}</span>
                      
                      <span className="text-gray-500">Student ID:</span>
                      <span className="font-mono">{selectedEvaluation.studentIdNumber || "N/A"}</span>
                      
                      <span className="text-gray-500">Test:</span>
                      <span className="font-medium">{selectedEvaluation.testName || "N/A"}</span>
                      
                      <span className="text-gray-500">Subject:</span>
                      <span className="font-medium">{selectedEvaluation.subject}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Evaluation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 font-semibold">
                    <div className="flex flex-col items-center justify-center py-2 bg-blue-50 rounded-lg">
                      <div className="text-3xl text-blue-700">
                        {selectedEvaluation.awardedMarks || 0} / {selectedEvaluation.totalMarks}
                      </div>
                      <div className="text-sm text-blue-500">
                        Marks Awarded
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      Evaluated on {formatDate(selectedEvaluation.evaluatedAt || selectedEvaluation.updatedAt)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Evaluator Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg border italic text-gray-700">
                    {selectedEvaluation.remarks || "No feedback provided."}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedEvaluation.evaluatedFileUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(selectedEvaluation.evaluatedFileUrl!, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Evaluated Sheet
                      </Button>
                    )}
                    {selectedEvaluation.answerSheetUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(selectedEvaluation.answerSheetUrl!, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Original Answer Sheet
                      </Button>
                    )}
                    {selectedEvaluation.questionPaperUrl && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(selectedEvaluation.questionPaperUrl, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Question Paper
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CompletedEvaluations;
