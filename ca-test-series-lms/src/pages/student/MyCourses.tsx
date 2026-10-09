import { useEffect, useState } from "react";
import { Menu, BookOpen, Play, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { Link } from "react-router-dom";
import { studentsApi } from "@/lib/api";
import { useStudentStore } from "@/lib/store";
import { formatDate } from "@/utils/dateUtils";

const MyCourses = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Get dashboard data from student store
  const { metrics, fetchProfile: fetchStudentDash } = useStudentStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNoPurchases, setHasNoPurchases] = useState(false);
  const [unattemptedCourses, setUnattemptedCourses] = useState<
    Array<{
      seriesId: string;
      testId: string;
      title: string;
      description: string;
      thumbnail: string;
      price: number;
      level: "Foundation" | "Intermediate" | "Final";
      subject: string;
      purchaseDate: string | null;
      testType: "objective" | "subjective" | "mixed";
      objectiveCompleted?: boolean;
      subjectiveCompleted?: boolean;
    }>
  >([]);
  const [purchasedSeries, setPurchasedSeries] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      thumbnail: string;
      price: number;
      level: "Foundation" | "Intermediate" | "Final";
      attemptsTotal: number;
      attemptsUsed: number;
      validity?: { isUnlimited: boolean; days?: number };
    }>
  >([]);

  useEffect(() => {
    // Fetch dashboard data
    fetchStudentDash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when fetchStudentDash changes

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentsApi.unattempted({ page: 1, pageSize: 100 });
        if (ignore) return;
        const items = res.data || [];
        const purchases = await studentsApi.purchases();
        setPurchasedSeries(purchases.data || []);
        setHasNoPurchases((purchases.data || []).length === 0);
        setUnattemptedCourses(items);
      } catch (e: unknown) {
        let msg = "Failed to load courses";
        if (typeof e === "object" && e !== null) {
          const err = e as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          msg = err.response?.data?.message || err.message || msg;
        }
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Group tests by series ID
  const groupedCourses = unattemptedCourses.reduce(
    (acc, course) => {
      const existingSeries = acc.find(
        (group) => group.seriesId === course.seriesId
      );

      if (existingSeries) {
        existingSeries.tests.push(course);
        // Update series info to show combined test types
        if (!existingSeries.testTypes.includes(course.testType)) {
          existingSeries.testTypes.push(course.testType);
        }
      } else {
        acc.push({
          seriesId: course.seriesId,
          seriesTitle: getSeriesTitle(course),
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price,
          level: course.level,
          purchaseDate: course.purchaseDate,
          testTypes: [course.testType],
          tests: [course],
          totalTests: 1,
        });
      }

      return acc;
    },
    [] as Array<{
      seriesId: string;
      seriesTitle: string;
      description: string;
      thumbnail: string;
      price: number;
      level: "Foundation" | "Intermediate" | "Final";
      purchaseDate: string | null;
      testTypes: ("objective" | "subjective" | "mixed")[];
      tests: typeof unattemptedCourses;
      totalTests: number;
    }>
  );

  // Update each group's total test count
  groupedCourses.forEach((group) => {
    group.totalTests = group.tests.length;
  });

  // Helper function to get series title from individual test
  function getSeriesTitle(course: (typeof unattemptedCourses)[0]) {
    // If we have multiple tests, we want to show a series-level title
    // For now, we'll derive it from the first test title or use a generic name
    const seriesTests = unattemptedCourses.filter(
      (c) => c.seriesId === course.seriesId
    );
    if (seriesTests.length > 1) {
      // Find common parts or use a generic title
      const subjects = [...new Set(seriesTests.map((t) => t.subject))];
      return subjects.length === 1
        ? `${subjects[0]} Test Series`
        : "Mixed Test Series";
    }
    return course.title;
  }

  const getSeriesTestTypeIcon = (testTypes: string[]) => {
    if (testTypes.includes("mixed")) {
      return (
        <div className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          <BookOpen className="h-3 w-3" />
        </div>
      );
    } else if (
      testTypes.includes("objective") &&
      testTypes.includes("subjective")
    ) {
      return (
        <div className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          <BookOpen className="h-3 w-3" />
        </div>
      );
    } else if (testTypes.includes("objective")) {
      return <Play className="h-4 w-4" />;
    } else {
      return <BookOpen className="h-4 w-4" />;
    }
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
              <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
            </div>
            <div />
          </div>
        </header>

        <main className="p-6">
          {loading && <div className="text-gray-500">Loading courses…</div>}
          {error && <div className="text-red-600">{error}</div>}
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Completed Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics?.completedTests || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {metrics?.averageScore?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Test Series
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {groupedCourses.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {unattemptedCourses.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Mixed Series
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {
                    groupedCourses.filter(
                      (series) =>
                        series.testTypes.includes("mixed") ||
                        (series.testTypes.includes("objective") &&
                          series.testTypes.includes("subjective"))
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Grid: show grouped test series */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedCourses.map((series) => (
              <Card
                key={`series-${series.seriesId}`}
                className="overflow-hidden flex flex-col h-full group border transition-all hover:border-ca-primary hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={series.thumbnail}
                    alt={series.seriesTitle}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="secondary"
                      className="flex items-center bg-white/80 backdrop-blur-sm"
                    >
                      {getSeriesTestTypeIcon(series.testTypes)}
                      <span className="ml-1">
                        {series.testTypes.length > 1
                          ? "Mixed"
                          : series.testTypes[0]}
                      </span>
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="outline"
                      className="bg-white/80 backdrop-blur-sm"
                    >
                      {series.totalTests} Test{series.totalTests > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    {series.seriesTitle}
                  </CardTitle>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                    {series.description}
                  </p>
                </CardHeader>

                <CardContent className="flex-grow pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{series.level}</span>
                    <span>₹{series.price}</span>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Purchased:{" "}
                    {series.purchaseDate
                      ? formatDate(series.purchaseDate)
                      : "-"}
                  </div>

                  {/* Show test breakdown */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {series.tests.map((test) => (
                      <div key={test.testId} className="flex justify-between">
                        <span className="truncate mr-2">{test.title}</span>
                        <span className="text-gray-400 capitalize">
                          {test.testType}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Link
                    to={`/student/test-series/${series.seriesId}`}
                    className="w-full"
                  >
                    <Button className="w-full bg-ca-primary hover:bg-ca-primary/90">
                      <Play className="h-4 w-4 mr-2" />
                      View Test Series
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {/* Purchased Series cards (for series without pending tests or as overview) */}
            {purchasedSeries
              .filter(
                (s) => !unattemptedCourses.some((c) => c.seriesId === s.id)
              )
              .map((s) => (
                <Card
                  key={`series:${s.id}`}
                  className="overflow-hidden flex flex-col h-full group border transition-all hover:border-ca-primary hover:shadow-lg"
                >
                  <div className="relative">
                    <img
                      src={s.thumbnail}
                      alt={s.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="secondary"
                        className="flex items-center bg-white/80 backdrop-blur-sm"
                      >
                        <span className="ml-1">Purchased</span>
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {s.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                      {s.description}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{s.level}</span>
                      <span>₹{s.price}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        Validity:{" "}
                        {s.validity?.isUnlimited
                          ? "Unlimited"
                          : `${s.validity?.days || 0} days`}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Link
                      to={`/student/test-series/${s.id}`}
                      className="w-full"
                    >
                      <Button className="w-full bg-ca-primary hover:bg-ca-primary/90">
                        View Series
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
          </div>

          {groupedCourses.length === 0 && !hasNoPurchases && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                All tests completed!
              </h3>
              <p className="text-gray-600 mb-4">
                Great job! You've attempted all your purchased tests.
              </p>
              <Link to="/student/courses">
                <Button>View My Courses</Button>
              </Link>
            </div>
          )}
          {groupedCourses.length === 0 && hasNoPurchases && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                You have no test series yet
              </h3>
              <p className="text-gray-600 mb-4">
                Head to the marketplace to browse and purchase your first test
                series.
              </p>
                  <Link to="/buy-now">
                <Button>Go to Marketplace</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyCourses;
