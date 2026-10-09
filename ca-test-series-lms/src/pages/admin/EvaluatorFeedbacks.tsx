import { useState, useEffect } from "react";
import { Menu, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { adminApi, type EvaluatorFeedback } from "@/lib/api";
import { GRADIENT_COLORS } from "@/constants/colors";
import { formatDateTime } from "@/utils/dateUtils";

const EvaluatorFeedbacks = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<EvaluatorFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] =
    useState<EvaluatorFeedback | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"feedbackAt" | "rating" | "evaluatedAt">(
    "feedbackAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Fetch feedbacks
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: currentPage,
          pageSize,
          ...(ratingFilter !== "all" && { rating: parseInt(ratingFilter) }),
          sortBy,
          sortOrder,
        };

        const response = await adminApi.getEvaluatorFeedbacks(params);
        setFeedbacks(response.data);
        setTotalPages(response.pagination.totalPages);
        setSummary(response.summary);
      } catch (err: unknown) {
        console.error("Error fetching feedbacks:", err);
        let errorMessage = "Failed to load feedbacks";
        if (typeof err === "object" && err !== null) {
          const error = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          errorMessage =
            error.response?.data?.message || error.message || errorMessage;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [currentPage, pageSize, ratingFilter, sortBy, sortOrder]);

  // Filter feedbacks by search term (client-side)
  const safeLower = (v?: string) => (typeof v === 'string' ? v.toLowerCase() : '');
  const term = searchTerm.toLowerCase();
  const filteredFeedbacks = feedbacks.filter(fb => {
    if (!term) return true;
    return (
      safeLower(fb.evaluator?.fullName).includes(term) ||
      safeLower(fb.student?.fullName).includes(term) ||
      safeLower(fb.testInfo?.title).includes(term) ||
      safeLower(fb.subject).includes(term)
    );
  });

  const handleViewFeedback = (feedback: EvaluatorFeedback) => {
    setSelectedFeedback(feedback);
    setFeedbackDialog(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
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
                Evaluator Feedbacks
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.totalFeedbacks}
                  </div>
                  <div className="text-sm text-gray-500">Total Feedbacks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-2xl font-bold text-yellow-600">
                      {summary.averageRating}
                    </span>
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.ratingDistribution[5]}
                  </div>
                  <div className="text-sm text-gray-500">5-Star Ratings</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.ratingDistribution[1] +
                      summary.ratingDistribution[2]}
                  </div>
                  <div className="text-sm text-gray-500">
                    Low Ratings (1-2★)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search feedbacks..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(
                    value: "feedbackAt" | "rating" | "evaluatedAt"
                  ) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedbackAt">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="evaluatedAt">Evaluation Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading feedbacks...
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-red-600">{error}</div>
          )}

          {/* Feedbacks List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No feedbacks found
                </div>
              ) : (
                filteredFeedbacks.map((feedback) => (
                  <Card
                    key={feedback._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${GRADIENT_COLORS.BLUE_TO_PURPLE} rounded-full flex items-center justify-center text-white font-semibold`}>
                            {(feedback.evaluator?.fullName || '?')
                              .split(' ')
                              .filter(Boolean)
                              .map(n => n[0])
                              .join('') || '?'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {feedback.evaluator?.fullName || 'Unknown Evaluator'}
                            </h3>
                            <p className="text-gray-600">
                              {(feedback.testInfo?.title || 'Untitled Test Series')} - {feedback.testInfo?.testTitle || 'Untitled Test'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Student: {feedback.student?.fullName || 'Unknown'} | Subject: {feedback.subject || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {renderStars(feedback.feedback?.rating ?? 0)}
                            </div>
                            <div className="text-sm text-gray-500">Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {feedback.awardedMarks ?? '-'} / {feedback.totalMarks ?? '-'}
                            </div>
                            <div className="text-sm text-gray-500">Score</div>
                          </div>
                          <Button onClick={() => handleViewFeedback(feedback)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Feedback Details Dialog */}
      <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-800">Evaluator</h4>
                  <p className="text-gray-600">
                    {selectedFeedback.evaluator.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedFeedback.evaluator.email}
                  </p>
                  {selectedFeedback.evaluator.specializations && (
                    <p className="text-sm text-gray-500">
                      Specializations:{" "}
                      {selectedFeedback.evaluator.specializations.join(", ")}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Student</h4>
                  <p className="text-gray-600">
                    {selectedFeedback.student.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedFeedback.student.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Level: {selectedFeedback.student.caLevel}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Test Information
                </h4>
                <p className="text-gray-600">
                  {selectedFeedback.testInfo?.title || 'Untitled Test Series'}
                </p>
                <p className="text-sm text-gray-500">
                  Test: {selectedFeedback.testInfo?.testTitle || 'Untitled Test'}
                </p>
                <p className="text-sm text-gray-500">
                  Subject: {selectedFeedback.subject || 'N/A'}
                </p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm">
                    Score: {selectedFeedback.awardedMarks ?? '-'} / {selectedFeedback.totalMarks ?? '-'}
                  </span>
                  <span className="text-sm">
                    Percentage:{" "}
                    {selectedFeedback.awardedMarks != null && selectedFeedback.totalMarks
                      ? Math.round((selectedFeedback.awardedMarks / selectedFeedback.totalMarks) * 100)
                      : '-'}
                    %
                  </span>
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Student Feedback
                      </h4>
                      <p className="text-sm text-gray-600">
                        Evaluated on: {formatDateTime(selectedFeedback.evaluatedAt)}
                      </p>
                      {selectedFeedback.feedback?.feedbackAt && (
                        <p className="text-sm text-gray-600">
                          Feedback given on:{" "}
                          {formatDateTime(selectedFeedback.feedback?.feedbackAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        {renderStars(selectedFeedback.feedback?.rating ?? 0)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {(selectedFeedback.feedback?.rating ?? 0)}/5 stars
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700">
                      {selectedFeedback.feedback?.comment ||
                        "No written feedback provided"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluatorFeedbacks;
