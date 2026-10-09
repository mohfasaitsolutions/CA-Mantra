import { useState, useEffect } from "react";
import {
  Menu,
  Filter,
  Search,
  Eye,
  Download,
  Calendar,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import EvaluatorRating from "@/components/student/EvaluatorRating";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { studentsApi } from "@/lib/api/students";
import { formatDate } from "@/utils/dateUtils";

type EvaluationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "not_required";

interface TestHistoryItem {
  id: string;
  name: string;
  date: string;
  score?: number;
  total: number;
  status: EvaluationStatus;
  type: "objective" | "subjective";
  testSeriesName: string;
  hasRated?: boolean;
  evaluatorName?: string;
  subject: string;
  answerPdfUrl?: string;
  evaluatedFileUrl?: string;
}

const TestHistory = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestHistoryItem | null>(
    null
  );
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch test history from API
  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        setLoading(true);
        const response = await studentsApi.history({ page: 1, pageSize: 100 });

        // Transform API data to component format
        const transformedData: TestHistoryItem[] = response.data.map(
          (item) => ({
            id: item.id,
            name: item.testName,
            date: item.date,
            score: item.score,
            total: item.maxScore,
            status: mapApiStatusToComponentStatus(item.status),
            type: item.type === "mixed" ? "subjective" : item.type, // Convert mixed to subjective
            testSeriesName: `${item.subject} Test Series`, // API doesn't provide series name, using subject
            hasRated: item.hasRated,
            evaluatorName: item.evaluatorName,
            subject: item.subject,
            answerPdfUrl: item.answerPdfUrl,
            evaluatedFileUrl: item.evaluatedFileUrl,
          })
        );

        setTestHistory(transformedData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch test history:", err);
        setError("Failed to load test history. Please try again.");
        setTestHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestHistory();
  }, []);

  // Map API status to component status
  const mapApiStatusToComponentStatus = (
    apiStatus: string
  ): EvaluationStatus => {
    switch (apiStatus) {
      case "completed":
        return "completed";
      case "pending":
        return "pending";
      case "failed":
        return "not_required";
      default:
        return "pending";
    }
  };

  // Filter and search functionality
  const filteredTests = testHistory.filter((test) => {
    // Filter by search term
    if (
      searchTerm &&
      !test.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !test.testSeriesName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !String(test.id).toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filter by test type
    if (filterType !== "all" && test.type !== filterType) {
      return false;
    }

    // Filter by evaluation status
    if (filterStatus !== "all" && test.status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Status badge renderer
  const renderStatusBadge = (status: EvaluationStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            Pending Evaluation
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Evaluation In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Evaluation Complete
          </Badge>
        );
      case "not_required":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Auto-Evaluated
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleRateEvaluator = (test: TestHistoryItem) => {
    setSelectedTest(test);
    setRatingDialogOpen(true);
  };

  const handleDownloadAnswerSheet = (test: TestHistoryItem) => {
    if (test.answerPdfUrl) {
      const link = document.createElement("a");
      link.href = test.answerPdfUrl;
      link.download = `suggested-answers-${test.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading suggested answer sheet for ${test.name}`,
      });
    } else {
      toast({
        title: "Not Available",
        description: "Suggested answer sheet is not available for this test.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadEvaluatedSheet = (test: TestHistoryItem) => {
    if (test.evaluatedFileUrl) {
      const link = document.createElement("a");
      link.href = test.evaluatedFileUrl;
      link.download = `evaluated-answer-${test.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading your evaluated answer sheet for ${test.name}`,
      });
    } else {
      toast({
        title: "Not Available",
        description: "Evaluated answer sheet is not available yet.",
        variant: "destructive",
      });
    }
  };

  const renderActionButtons = (test: TestHistoryItem) => {
    const buttons = [];

    // Review/View button for all types
    if (test.type === "objective") {
      buttons.push(
        <Button key="review" variant="outline" size="sm" asChild>
          <Link to={`/test/${test.id}/analysis`}>
            <Eye className="h-4 w-4 mr-1" />
            Review
          </Link>
        </Button>
      );
    } else {
      buttons.push(
        <Button key="view" variant="outline" size="sm" asChild>
          <Link to={`/test/${test.id}/analysis`}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Link>
        </Button>
      );
    }

    // Download Answer Sheet for subjective
    if (test.type === "subjective") {
      buttons.push(
        <Button
          key="download-suggested"
          variant="outline"
          size="sm"
          onClick={() => handleDownloadAnswerSheet(test)}
          disabled={!test.answerPdfUrl}
        >
          <Download className="h-4 w-4 mr-1" />
          Answer Sheet
        </Button>
      );

      // Download evaluated answer sheet if available
      if (test.status === "completed" && test.evaluatedFileUrl) {
        buttons.push(
          <Button
            key="download-evaluated"
            variant="outline"
            size="sm"
            onClick={() => handleDownloadEvaluatedSheet(test)}
          >
            <Download className="h-4 w-4 mr-1" />
            Evaluated Sheet
          </Button>
        );
      }
    }

    // Rating button for subjective (only if completed and not rated)
    if (test.type === "subjective" && test.status === "completed") {
      buttons.push(
        <Button
          key="rate"
          variant="outline"
          size="sm"
          onClick={() => handleRateEvaluator(test)}
          disabled={test.hasRated}
        >
          <Star className="h-4 w-4 mr-1" />
          {test.hasRated ? "Rated" : "Rate"}
        </Button>
      );
    }

    return buttons;
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
              <h1 className="text-2xl font-bold text-gray-800">Test History</h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:justify-between">
              <div>
                <CardTitle>Completed Tests</CardTitle>
                <CardDescription>
                  View your test history and results
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search by name, series, or ID..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Test Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="objective">Objective</SelectItem>
                      <SelectItem value="subjective">Subjective</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading test history...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No completed tests found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3">Submission ID</th>
                        <th className="text-left p-3">Test Name</th>
                        <th className="text-left p-3">Test Series Name</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3">Score</th>
                        <th className="text-left p-3">Evaluator</th>
                        <th className="text-center p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.map((test) => (
                        <tr key={test.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium font-mono text-sm">{test.id.slice(-8)}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{test.name}</div>
                          </td>
                          <td className="p-3">{test.testSeriesName}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                              {formatDate(test.date)}
                            </div>
                          </td>
                          <td className="p-3 capitalize">{test.type}</td>
                          <td className="p-3">
                            {test.score !== undefined ? (
                              <div>
                                <div className="font-medium">
                                  {test.score}/{test.total}
                                </div>
                                {renderStatusBadge(test.status)}
                              </div>
                            ) : (
                              renderStatusBadge(test.status)
                            )}
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {test.type === "objective"
                                ? "Automated"
                                : test.evaluatorName || "Auto-evaluated"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center gap-2 flex-wrap">
                              {renderActionButtons(test)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Rating Dialog */}
      {selectedTest && (
        <EvaluatorRating
          isOpen={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          testName={selectedTest.name}
          submissionId={selectedTest.id}
          evaluatorName={selectedTest.evaluatorName}
        />
      )}
    </div>
  );
};

export default TestHistory;
