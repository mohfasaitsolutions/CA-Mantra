import { useEffect, useMemo, useState } from "react";
import { Menu, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { studentsApi } from "@/lib/api";

const AnalyticsPage = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<
    Array<{
      subject: string;
      averageScore: number;
      averagePercentage: number;
      totalAttempts: number;
    }>
  >([]);
  const [rankings, setRankings] = useState<{
    allIndiaRank: number | null;
    stateRank: number | null;
    cityRank: number | null;
    percentile: number;
    totalStudents: number;
    overallPercentage: number;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentsApi.analytics();
        if (!ignore) {
          setPerformance(res.performanceData || []);
          setRankings(res.rankings || null);
        }
      } catch (e: unknown) {
        let msg = "Failed to load analytics";
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

  // Derive summary numbers from performance
  const analyticsData = useMemo(() => {
    if (!performance.length) {
      return {
        allIndiaRank: rankings?.allIndiaRank || null,
        totalStudents: rankings?.totalStudents || 0,
        stateRank: rankings?.stateRank || null,
        cityRank: rankings?.cityRank || null,
        percentile: rankings?.percentile || 0,
        averageScore: rankings?.overallPercentage || 0,
        highestScore: 0,
        lowestScore: 0,
        improvementRate: 0,
        testsTaken: 0,
        strongSubjects: [] as string[],
        weakSubjects: [] as string[],
      };
    }

    // Use averagePercentage for calculations (proper percentages)
    const scores = performance.map((p) => p.averagePercentage || 0);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Sort by percentage for strengths/weaknesses
    const sorted = [...performance].sort(
      (a, b) => (b.averagePercentage || 0) - (a.averagePercentage || 0)
    );
    const strongSubjects = sorted
      .slice(0, Math.min(2, sorted.length))
      .map((s) => s.subject);
    const weakSubjects = sorted
      .slice(-Math.min(2, sorted.length))
      .map((s) => s.subject);

    return {
      allIndiaRank: rankings?.allIndiaRank || null,
      totalStudents: rankings?.totalStudents || 0,
      stateRank: rankings?.stateRank || null,
      cityRank: rankings?.cityRank || null,
      percentile: rankings?.percentile || 0,
      averageScore: rankings?.overallPercentage || 0,
      highestScore: Math.round(highest * 100) / 100,
      lowestScore: Math.round(lowest * 100) / 100,
      improvementRate: 0, // TODO: Calculate based on historical data
      testsTaken: performance.reduce((a, b) => a + (b.totalAttempts || 0), 0),
      strongSubjects,
      weakSubjects,
    };
  }, [performance, rankings]);

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
              <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {loading && <div className="text-gray-500">Loading analytics…</div>}
          {error && <div className="text-red-600">{error}</div>}
          {/* Rank Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  All India Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analyticsData.allIndiaRank
                    ? `#${analyticsData.allIndiaRank}`
                    : "-"}
                </div>
                <p className="text-sm text-gray-500">
                  out of {analyticsData.totalStudents || 0} students
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  State Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analyticsData.stateRank
                    ? `#${analyticsData.stateRank}`
                    : "-"}
                </div>
                <p className="text-sm text-gray-500">in your state</p>
              </CardContent>
            </Card>

            {/* <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  City Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analyticsData.cityRank ? `#${analyticsData.cityRank}` : "-"}
                </div>
                <p className="text-sm text-gray-500">in your city</p>
              </CardContent>
            </Card> */}

            {/* <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Percentile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {analyticsData.percentile
                    ? `${analyticsData.percentile}%`
                    : "-"}
                </div>
                <p className="text-sm text-gray-500">better than others</p>
              </CardContent>
            </Card> */}
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Score</span>
                  <span className="font-semibold">
                    {analyticsData.averageScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Highest Score</span>
                  <span className="font-semibold text-green-600">
                    {analyticsData.highestScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Lowest Score</span>
                  <span className="font-semibold text-red-600">
                    {analyticsData.lowestScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Improvement Rate</span>
                  <span className="font-semibold text-blue-600">
                    +{analyticsData.improvementRate}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Subject Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">
                    Strong Subjects
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.strongSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-2">
                    Areas for Improvement
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.weakSubjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant="secondary"
                        className="bg-red-100 text-red-800"
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;
