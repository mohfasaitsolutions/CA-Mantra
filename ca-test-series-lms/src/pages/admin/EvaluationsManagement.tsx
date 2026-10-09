import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  Star,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Menu,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, type Evaluation } from "@/lib/api/admin";
import { formatDateTime } from "@/utils/dateUtils";

const EvaluationsManagement = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Evaluation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    | "submittedAt"
    | "evaluatedAt"
    | "createdAt"
    | "updatedAt"
    | "awardedMarks"
    | "status"
  >("submittedAt");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "admin-evaluations",
      currentPage,
      statusFilter,
      subjectFilter,
      sortBy,
      searchTerm,
    ],
    queryFn: () =>
      adminApi.getEvaluations({
        page: currentPage,
        pageSize,
        status: statusFilter !== "all" ? statusFilter : undefined,
        subject: subjectFilter !== "all" ? subjectFilter : undefined,
        sortBy,
        sortOrder: "desc",
      }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PENDING":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "ASSIGNED":
        return <User className="h-4 w-4" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setDialogOpen(true);
  };

  const safeLower = (v: unknown) =>
    typeof v === "string" ? v.toLowerCase() : "";
  const term = searchTerm.trim().toLowerCase();
  const filteredEvaluations =
    data?.data?.filter((evaluation) => {
      if (!term) return true;
      return (
        String(evaluation.studentId || evaluation.student?.studentNumericId || "").toLowerCase().includes(term) ||
        safeLower(evaluation.student?.fullName).includes(term) ||
        safeLower(evaluation.testInfo?.testTitle).includes(term) ||
        safeLower(evaluation.testInfo?.title).includes(term) ||
        safeLower(evaluation.evaluator?.fullName).includes(term)
      );
    }) || [];

  // Debug: Log the first evaluation to check data structure
  if (data?.data && data.data.length > 0) {
    console.log("First evaluation:", data.data[0]);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <Sidebar role="admin" />
      <MobileSidebar
        role="admin"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">{/* Added min-w-0 to prevent flex overflow */}
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
                Evaluations
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mt-1">
              Manage and monitor all test evaluations
            </p>
          </div>

          {/* Summary Cards */}
          {data?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.summary.totalSubmissions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {data.summary.pendingCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {data.summary.completedCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Avg. Percentage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.summary.averagePercentage.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students, tests, evaluators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select
                    value={subjectFilter}
                    onValueChange={setSubjectFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="Accounts">Accounts</SelectItem>
                      <SelectItem value="Law">Law</SelectItem>
                      <SelectItem value="Taxation">Taxation</SelectItem>
                      <SelectItem value="Audit">Audit</SelectItem>
                      <SelectItem value="Cost">Cost</SelectItem>
                      <SelectItem value="FR">FR</SelectItem>
                      <SelectItem value="SFM">SFM</SelectItem>
                      <SelectItem value="SCMPE">SCMPE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: string) =>
                      setSortBy(value as typeof sortBy)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="submittedAt">
                        Submitted Date
                      </SelectItem>
                      <SelectItem value="evaluatedAt">
                        Evaluated Date
                      </SelectItem>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                      <SelectItem value="awardedMarks">Marks</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Evaluations
                </span>
                <span className="text-sm text-gray-600">
                  {data?.pagination.total || 0} total evaluations
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading evaluations
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Student ID</TableHead>
                            <TableHead className="whitespace-nowrap">Test ID</TableHead>
                            <TableHead className="whitespace-nowrap">Student</TableHead>
                            <TableHead className="whitespace-nowrap">Test</TableHead>
                            <TableHead className="whitespace-nowrap">Subject</TableHead>
                            <TableHead className="whitespace-nowrap">Evaluator</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Created</TableHead>
                            <TableHead className="whitespace-nowrap">Submitted</TableHead>
                            <TableHead className="whitespace-nowrap">Marks</TableHead>
                            <TableHead className="whitespace-nowrap">Rating</TableHead>
                            <TableHead className="whitespace-nowrap">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {filteredEvaluations.map((evaluation) => (
                        <TableRow key={evaluation._id}>
                          <TableCell className="font-mono text-sm">
                            {evaluation.studentId || evaluation.student?.studentNumericId || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {evaluation.testId ? evaluation.testId.slice(-8) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                {evaluation.student?.profilePictureUrl ? (
                                  <img
                                    src={evaluation.student.profilePictureUrl}
                                    alt={evaluation.student.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span>{evaluation.student?.fullName?.charAt(0) || "?"}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {evaluation.student?.fullName || "-"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {evaluation.student?.caLevel || "-"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: {evaluation.studentId || evaluation.student?.studentNumericId || "-"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            <div>
                              <div className="font-medium">
                                {evaluation.testInfo?.testTitle || evaluation.subject || "-"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {evaluation.testInfo?.title || ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {evaluation.subject || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {evaluation.evaluator ? (
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                                  {evaluation.evaluator.profilePictureUrl ? (
                                    <img
                                      src={evaluation.evaluator.profilePictureUrl}
                                      alt={evaluation.evaluator.fullName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span>{evaluation.evaluator.fullName?.charAt(0) || "?"}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {evaluation.evaluator.fullName || "-"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {evaluation.evaluator.email || "-"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">
                                Not assigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(evaluation.status)}
                            >
                              {getStatusIcon(evaluation.status)}
                              <span className="ml-1">
                                {evaluation.status.replace("_", " ")}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {evaluation.createdAt
                              ? formatDateTime(evaluation.createdAt)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {evaluation.submittedAt
                              ? formatDateTime(evaluation.submittedAt)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {evaluation.awardedMarks !== null ? (
                              <div>
                                <span className="font-medium">
                                  {evaluation.awardedMarks}
                                </span>
                                <span className="text-gray-500">
                                  /{evaluation.totalMarks}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {evaluation.totalMarks
                                    ? Math.round(
                                        (evaluation.awardedMarks /
                                          evaluation.totalMarks) *
                                          100
                                      )
                                    : 0}
                                  %
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {evaluation.feedback?.rating ? (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="ml-1 font-medium">
                                  {evaluation.feedback.rating}/5
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No rating</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(evaluation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {evaluation.answerPdfUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      evaluation.answerPdfUrl,
                                      "_blank"
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, data.pagination.total)}{" "}
                    of {data.pagination.total} evaluations
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {currentPage} of {data.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, data.pagination.totalPages)
                        )
                      }
                      disabled={currentPage === data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Evaluation Details Dialog */}
      {selectedEvaluation && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Evaluation Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Name
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.student?.fullName || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Student ID
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.studentId || selectedEvaluation.student?.studentNumericId || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.student?.email || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        CA Level
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.student?.caLevel || "-"}
                      </p>
                    </div>
                    {(selectedEvaluation.student?.mobile || selectedEvaluation.student?.phone) && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Phone
                        </label>
                        <p className="text-sm">
                          {selectedEvaluation.student.mobile || selectedEvaluation.student.phone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Test Title
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.testInfo?.testTitle || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Test Series
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.testInfo?.title || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Subject
                      </label>
                      <p className="text-sm">{selectedEvaluation.subject || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Category
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.testInfo?.category || "-"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Evaluation Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evaluation Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          className={getStatusColor(selectedEvaluation.status)}
                        >
                          {getStatusIcon(selectedEvaluation.status)}
                          <span className="ml-1">
                            {selectedEvaluation.status.replace("_", " ")}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Submitted At
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.submittedAt ? formatDateTime(selectedEvaluation.submittedAt) : "-"}
                      </p>
                    </div>
                    {selectedEvaluation.evaluatedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Evaluated At
                        </label>
                        <p className="text-sm">
                          {formatDateTime(selectedEvaluation.evaluatedAt)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Created At
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.createdAt ? formatDateTime(selectedEvaluation.createdAt) : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Last Updated
                      </label>
                      <p className="text-sm">
                        {selectedEvaluation.updatedAt ? formatDateTime(selectedEvaluation.updatedAt) : "-"}
                      </p>
                    </div>
                  </div>

                  {selectedEvaluation.evaluator && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600">
                        Evaluator
                      </label>
                      <div className="mt-1">
                        <p className="text-sm font-medium">
                          {selectedEvaluation.evaluator.fullName || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedEvaluation.evaluator.email || "-"}
                        </p>
                        {selectedEvaluation.evaluator.specializations?.length >
                          0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedEvaluation.evaluator.specializations.map(
                              (spec: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {spec}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Marks and Feedback */}
              {selectedEvaluation.status === "COMPLETED" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Marks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedEvaluation.awardedMarks}/
                          {selectedEvaluation.totalMarks}
                        </div>
                        <div className="text-lg text-gray-600">
                          {Math.round(
                            (selectedEvaluation.awardedMarks! /
                              selectedEvaluation.totalMarks) *
                              100
                          )}
                          %
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedEvaluation.feedback && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Student Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="ml-2 text-lg font-semibold">
                              {selectedEvaluation.feedback.rating}/5
                            </span>
                          </div>
                          {selectedEvaluation.feedback.comment && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">
                                Comment
                              </label>
                              <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                                {selectedEvaluation.feedback.comment}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Submitted
                            </label>
                            <p className="text-sm">
                              {formatDateTime(
                                selectedEvaluation.feedback.feedbackAt
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* File Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {selectedEvaluation.answerPdfUrl && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedEvaluation.answerPdfUrl, "_blank")
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Answer Sheet
                      </Button>
                    )}
                    {selectedEvaluation.evaluatedFileUrl && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(
                            selectedEvaluation.evaluatedFileUrl,
                            "_blank"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Evaluated Sheet
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

export default EvaluationsManagement;
