import { useState, useEffect, useMemo } from "react";
import { Menu, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import TestSeriesCard from "@/components/TestSeriesCard";
import MockTest from "@/components/MockTest";
import ProfileSetup from "@/components/student/ProfileSetup";
import { useAuthStore } from "@/lib/store";
import { useStudentStore } from "@/lib/store";
import { studentsApi } from "@/lib/api";

const StudentDashboard = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMockTestOpen, setIsMockTestOpen] = useState(false);
  const { user, isProfileComplete } = useAuthStore();
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    allIndiaRank: number;
    totalStudents: number;
    percentile: number;
    overallPercentage: number;
    highestScore: number;
  } | null>(null);
  const [coursesData, setCoursesData] = useState<{
    purchased: Array<{
      id: string;
      title: string;
      description: string;
      thumbnail: string;
      price: number;
      level: "Foundation" | "Intermediate" | "Final";
    }>;
    unattempted: Array<{
      seriesId: string;
      testId: string;
      title: string;
      description: string;
      thumbnail: string;
      price: number;
      level: "Foundation" | "Intermediate" | "Final";
      subject: string;
      testType: "objective" | "subjective" | "mixed";
    }>;
  }>({ purchased: [], unattempted: [] });

  const {
    profile,
    metrics,
    purchasedTestSeries,
    fetchProfile: fetchStudentDash,
    fetchPurchasedTestSeries,
    clearAllData,
  } = useStudentStore();

  // Initial load – fetch student data only (auth handled by ProtectedRoute)
  useEffect(() => {
    // Clear any stale data first
    clearAllData();

    // Don't call fetchProfile here - let ProtectedRoute handle auth
    fetchStudentDash(true);
    fetchPurchasedTestSeries(true);

    // Fetch analytics data for rankings and performance
    const fetchAnalytics = async () => {
      try {
        const analytics = await studentsApi.analytics();
        const testHistory = await studentsApi.history({
          page: 1,
          pageSize: 100,
        });

        // Calculate highest score from test history
        const highestScore = testHistory.data.reduce((max, test) => {
          if (test.score && test.maxScore) {
            const percentage = (test.score / test.maxScore) * 100;
            return Math.max(max, percentage);
          }
          return max;
        }, 0);

        setAnalyticsData({
          allIndiaRank: analytics.rankings.allIndiaRank,
          totalStudents: analytics.rankings.totalStudents,
          percentile: analytics.rankings.percentile,
          overallPercentage: analytics.rankings.overallPercentage,
          highestScore: Math.round(highestScore),
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        // Set default values if API fails
        setAnalyticsData({
          allIndiaRank: 0,
          totalStudents: 0,
          percentile: 0,
          overallPercentage: 0,
          highestScore: 0,
        });
      }
    };

    fetchAnalytics();

    // Fetch courses data
    const fetchCoursesData = async () => {
      try {
        const coursesResult = await studentsApi.getCourses();
        setCoursesData(coursesResult);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        // Set empty arrays if API fails
        setCoursesData({ purchased: [], unattempted: [] });
      }
    };

    fetchCoursesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Memoize profile completeness check to prevent infinite loops
  const needsProfileSetup = useMemo(() => {
    if (!user) return false;

    // PRIORITY 1: If backend says profile is complete, don't show dialog
    if (profile?.isProfileComplete === true) {
      // Also set localStorage flag for faster future checks
      if (user?.id) {
        localStorage.setItem(`profile-setup-completed-${user.id}`, "true");
      }
      return false;
    }

    // PRIORITY 2: Check localStorage flag (for performance on subsequent visits)
    const hasCompletedSetup =
      localStorage.getItem(`profile-setup-completed-${user.id}`) === "true";
    if (hasCompletedSetup) return false;

    // PRIORITY 3: Fallback to frontend logic if backend data not loaded yet
    return !isProfileComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    user?.mobile,
    user?.caLevel,
    user?.address,
    profile?.isProfileComplete,
  ]); // Include backend flag

  // Profile setup check - separate effect
  useEffect(() => {
    setIsProfileSetupOpen(needsProfileSetup);
  }, [needsProfileSetup]);

  // Memoize computed analytics values
  const computedAnalytics = useMemo(
    () => ({
      totalTests: metrics?.totalSubmissions || 0, // Use actual submissions, not purchased series length
      completedTests: metrics?.completedTests || 0,
      averageScore: Math.round(metrics?.averageScore || 0),
      highestScore: analyticsData?.highestScore || 0,
      rank: analyticsData?.allIndiaRank || 0,
      totalStudents: analyticsData?.totalStudents || 0,
      percentile: analyticsData?.percentile || 0,
      // Additional metrics using courses data
      totalPurchasedCourses: coursesData.purchased.length,
      totalAvailableTests: coursesData.unattempted.length,
      hasAnyCourses:
        coursesData.purchased.length > 0 || purchasedTestSeries.length > 0,
    }),
    [metrics, analyticsData, coursesData, purchasedTestSeries.length]
  );

  const handleProfileSetupComplete = () => {
    setIsProfileSetupOpen(false);

    // Mark profile setup as completed for this user
    if (user?.id) {
      localStorage.setItem(`profile-setup-completed-${user.id}`, "true");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <Sidebar role="student" />
      <MobileSidebar
        role="student"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 overflow-x-hidden w-full">
        <header className="bg-white p-3 md:p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto px-2">
            <div className="flex items-center min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 flex-shrink-0"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                Student Dashboard
              </h1>
            </div>
            <div className="ml-2 flex-shrink-0">
              <span className="text-xs md:text-sm text-gray-500 truncate">
                Welcome, {user?.name || profile?.name || "Student"}
              </span>
            </div>
          </div>
        </header>

        <main className="p-3 md:p-6 w-full overflow-x-hidden">
          <div className="grid gap-4 md:gap-6 max-w-7xl mx-auto w-full px-2">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full">
              <div className="ca-card bg-white p-3 md:p-5 rounded-lg shadow-sm w-full">
                <h3 className="text-sm md:text-base font-semibold mb-2">Test Performance</h3>
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-xl md:text-2xl font-bold text-ca-primary">
                      {computedAnalytics.averageScore}%
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Highest</p>
                    <p className="text-lg md:text-xl font-semibold">
                      {computedAnalytics.highestScore}%
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link to="/student/analytics">
                    <Button variant="outline" size="sm" className="w-full text-xs md:text-sm">
                      View Analytics
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="ca-card bg-white p-3 md:p-5 rounded-lg shadow-sm w-full">
                <h3 className="text-sm md:text-base font-semibold mb-2">All India Rank</h3>
                <div className="text-center px-1">
                  <p className="text-2xl md:text-3xl font-bold text-ca-primary">
                    {computedAnalytics.rank > 0
                      ? `#${computedAnalytics.rank}`
                      : "Not Ranked"}
                  </p>
                  <p className="text-xs text-gray-500 break-words">
                    {computedAnalytics.totalStudents > 0
                      ? `Out of ${computedAnalytics.totalStudents} students`
                      : "Take tests to get ranked"}
                  </p>
                  {computedAnalytics.percentile > 0 && (
                    <p className="text-xs text-ca-primary mt-1">
                      {computedAnalytics.percentile}th percentile
                    </p>
                  )}
                </div>
              </div>

              <div className="ca-card bg-white p-3 md:p-5 rounded-lg shadow-sm w-full">
                <h3 className="text-sm md:text-base font-semibold mb-2">Mock Test</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3">
                  Practice test to improve skills
                </p>
                <Button
                  onClick={() => setIsMockTestOpen(true)}
                  className="w-full flex items-center justify-center text-xs md:text-sm"
                  size="sm"
                >
                  <PlayCircle className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Start Mock Test
                </Button>
              </div>
            </section>

            <section className="ca-card bg-white p-3 md:p-5 rounded-lg shadow-sm w-full">
              <h3 className="text-sm md:text-base font-semibold mb-3">
                Test Completion Progress
              </h3>
              {computedAnalytics.totalTests > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>Completed Tests</span>
                    <span className="font-semibold">
                      {computedAnalytics.completedTests}/
                      {computedAnalytics.totalTests}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full relative">
                    <div
                      className="h-full ca-gradient rounded-full transition-all duration-500"
                      style={{
                        width: (() => {
                          const total = computedAnalytics.totalTests || 0;
                          const done = computedAnalytics.completedTests || 0;
                          const pct = total > 0 ? (done / total) * 100 : 0;
                          const clamped = Math.min(100, Math.max(0, pct));
                          return `${clamped}%`;
                        })(),
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(
                          computedAnalytics.totalTests > 0
                            ? (computedAnalytics.completedTests /
                                computedAnalytics.totalTests) *
                                100
                            : 0
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </>
              ) : computedAnalytics.hasAnyCourses &&
                computedAnalytics.totalAvailableTests > 0 ? (
                <>
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-700 mb-1">
                      Ready to start testing!
                    </p>
                    <p className="text-xs text-gray-500">
                      You have {computedAnalytics.totalPurchasedCourses} course
                      {computedAnalytics.totalPurchasedCourses !== 1
                        ? "s"
                        : ""}{" "}
                      with {computedAnalytics.totalAvailableTests} available
                      test
                      {computedAnalytics.totalAvailableTests !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span>Tests Completed</span>
                    <span className="font-semibold">
                      0/{computedAnalytics.totalAvailableTests}
                    </span>
                  </div>

                  <div className="h-3 bg-gray-200 rounded-full relative mb-3">
                    <div className="h-full bg-gray-300 rounded-full w-0 transition-all duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        0%
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link to="/student/courses">
                      <Button
                        size="sm"
                        className="bg-ca-primary hover:bg-ca-primary/90"
                      >
                        Start Your First Test
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No tests attempted yet</p>
                  <p className="text-sm">
                    Purchase a test series to start practicing
                  </p>
                </div>
              )}
            </section>

            <section className="ca-card bg-white p-3 md:p-5 rounded-lg shadow-sm w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <h3 className="text-sm md:text-base font-semibold">My Purchased Courses</h3>
                <Link to="/student/courses">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-ca-primary text-xs md:text-sm"
                  >
                    View All
                  </Button>
                </Link>
              </div>

              {coursesData.purchased.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coursesData.purchased.map((course) => (
                    <div
                      key={course.id}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-28 md:h-32 object-cover rounded-md mb-2"
                      />
                      <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-ca-primary font-medium">
                          {course.level}
                        </span>
                        <span className="text-gray-500">₹{course.price}</span>
                      </div>
                      <Link to={`/student/test-series/${course.id}`}>
                        <Button className="w-full text-xs" size="sm">
                          View Course
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg mb-2">No courses purchased yet</p>
                  <p className="text-sm mb-4">
                    Browse and purchase courses to start learning
                  </p>
                  <Link to="/buy-now">
                    <Button>Browse Courses</Button>
                  </Link>
                </div>
              )}
            </section>

            <section className="mt-4 md:mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                <h2 className="text-lg md:text-xl font-bold">My Test Series</h2>
                <Button variant="outline" className="text-ca-primary flex-shrink-0 text-xs md:text-sm" size="sm">
                  View All Tests
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {purchasedTestSeries.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    <p className="text-lg mb-2">No test series purchased yet</p>
                    <p className="text-sm mb-4">
                      Browse and purchase test series to start practicing
                    </p>
                    <Link to="/buy-now">
                      <Button>Browse Test Series</Button>
                    </Link>
                  </div>
                )}
                {purchasedTestSeries.map((series) => (
                  <TestSeriesCard
                    key={series.id}
                    id={series.id}
                    title={series.title}
                    description={series.description}
                    thumbnail={series.thumbnail}
                    price={series.price}
                    level={
                      series.level === "Final"
                        ? "Intermediate"
                        : (series.level as "Foundation" | "Intermediate")
                    }
                    isPurchased
                  />
                ))}
              </div>
            </section>

            <section className="mt-4 md:mt-6">
              <div className="ca-card flex flex-col md:flex-row items-center justify-between p-3 md:p-5 bg-ca-primary text-white gap-3">
                <div className="text-center md:text-left">
                  <h3 className="text-base md:text-lg font-bold mb-1">Need Help?</h3>
                  <p className="text-xs md:text-sm mb-3 md:mb-0">
                    Our support team is here to assist you with any questions.
                  </p>
                </div>
                <Link to="/student/contact-support" className="w-full md:w-auto">
                  <Button
                    size="sm"
                    className="bg-white text-ca-primary hover:bg-white/90 w-full md:w-auto text-xs md:text-sm"
                  >
                    Contact Support
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>

      <MockTest
        isOpen={isMockTestOpen}
        onClose={() => setIsMockTestOpen(false)}
      />

      <ProfileSetup
        isOpen={isProfileSetupOpen}
        onComplete={handleProfileSetupComplete}
      />
    </div>
  );
};

export default StudentDashboard;
