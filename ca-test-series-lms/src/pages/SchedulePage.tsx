import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Download,
  Filter,
  Search,
  Grid,
  List,
  Star,
  Tag,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  usePublicSchedules,
  PublicSchedule,
} from "@/hooks/use-public-schedules";
import { GRADIENT_COLORS } from "@/constants/colors";

const SchedulePage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [examSessionFilter, setExamSessionFilter] = useState("all");
  const [examYearFilter, setExamYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();

  const filters = useMemo(
    () => ({
      examType: examTypeFilter === "all" ? undefined : examTypeFilter,
      examSession: examSessionFilter === "all" ? undefined : examSessionFilter,
      examYear: examYearFilter === "all" ? undefined : parseInt(examYearFilter),
      search: searchQuery || undefined,
      page: currentPage,
      pageSize: 12,
      sortBy: "priority",
      sortOrder: "desc" as const,
    }),
    [
      examTypeFilter,
      examSessionFilter,
      examYearFilter,
      searchQuery,
      currentPage,
    ]
  );

  const {
    schedules,
    pagination,
    summary,
    loading,
    error,
    downloadSchedule,
    refetch,
  } = usePublicSchedules();

  // Fetch schedules when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refetch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, refetch]);

  const handleDownload = async (schedule: PublicSchedule) => {
    try {
      await downloadSchedule(schedule.id);
      toast({
        title: "Download Started",
        description: `${schedule.fileName} is being downloaded.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download schedule",
      });
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case "FOUNDATION":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-primary/10 text-primary";
      case "FINAL":
        return "bg-accent/10 text-accent";
      case "ALL":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionColor = (session: string) => {
    switch (session) {
      case "MAY":
        return "bg-orange-100 text-orange-800";
      case "NOVEMBER":
        return "bg-primary/10 text-primary";
      case "BOTH":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate year options for filter
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear + i - 1);

  if (loading && !schedules.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exam schedules...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className={`${GRADIENT_COLORS.GREEN_TO_BLUE} text-white py-16`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Exam Schedules
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Stay updated with the latest CA exam schedules and important dates
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.totalSchedules || 0}
                </div>
                <div className="text-sm opacity-80">Total Schedules</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.foundationSchedules || 0}
                </div>
                <div className="text-sm opacity-80">Foundation</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.intermediateSchedules || 0}
                </div>
                <div className="text-sm opacity-80">Intermediate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">
                  {summary?.finalSchedules || 0}
                </div>
                <div className="text-sm opacity-80">Final</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search schedules, exam types, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Exam Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FOUNDATION">Foundation</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="FINAL">Final</SelectItem>
                <SelectItem value="ALL">All Levels</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={examSessionFilter}
              onValueChange={setExamSessionFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="MAY">May</SelectItem>
                <SelectItem value="NOVEMBER">November</SelectItem>
                <SelectItem value="BOTH">Both Sessions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={examYearFilter} onValueChange={setExamYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setExamTypeFilter("all");
                setExamSessionFilter("all");
                setExamYearFilter("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch(filters)}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedules Grid/List */}
        {schedules.length === 0 && !loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No schedules found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className={`hover:shadow-lg transition-shadow ${
                    viewMode === "list" ? "flex flex-row" : ""
                  }`}
                >
                  {viewMode === "grid" ? (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={getExamTypeColor(schedule.examType)}
                            >
                              {schedule.examType}
                            </Badge>
                            <Badge
                              className={getSessionColor(schedule.examSession)}
                            >
                              {schedule.examSession} {schedule.examYear}
                            </Badge>
                            {schedule.priority > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {schedule.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pb-3">
                        {schedule.description && (
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                            {schedule.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500">
                            {schedule.readableFileSize}
                          </span>
                        </div>

                        {schedule.tags && schedule.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {schedule.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {schedule.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{schedule.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                      </CardContent>

                      <CardFooter className="pt-3">
                        <Button
                          onClick={() => handleDownload(schedule)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Schedule
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    // List view
                    <div className="flex-1 flex items-center p-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            className={getExamTypeColor(schedule.examType)}
                          >
                            {schedule.examType}
                          </Badge>
                          <Badge
                            className={getSessionColor(schedule.examSession)}
                          >
                            {schedule.examSession} {schedule.examYear}
                          </Badge>
                          {schedule.priority > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Priority
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-1">
                          {schedule.title}
                        </h3>
                        {schedule.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {schedule.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{schedule.readableFileSize}</span>
                          <span>{schedule.fileName}</span>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button onClick={() => handleDownload(schedule)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setCurrentPage(pagination.page - 1)}
                  >
                    Previous
                  </Button>

                  <span className="px-4 py-2 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading overlay for subsequent requests */}
        {loading && schedules.length > 0 && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                Updating schedules...
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SchedulePage;
