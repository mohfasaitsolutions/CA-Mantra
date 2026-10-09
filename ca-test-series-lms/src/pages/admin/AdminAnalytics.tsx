import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  LineChart,
  PieChart,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/utils/dateUtils";
import {
  ResponsiveContainer,
  LineChart as RechartLine,
  Line,
  BarChart as RechartBar,
  Bar,
  PieChart as RechartPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";

// Colors for charts - using theme colors
const COLORS = ["hsl(207 72% 39%)", "hsl(207 72% 50%)", "hsl(176 56% 46%)", "hsl(176 56% 60%)", "hsl(207 72% 70%)"];

const AdminAnalytics = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [timeRange, _setTimeRange] = useState("30");
  const navigate = useNavigate();
  const { isLoggedIn, role } = useAuth();

  // Check authentication
  useEffect(() => {
    console.log("Auth check - isLoggedIn:", isLoggedIn, "role:", role);
    if (!isLoggedIn) {
      console.log("Not logged in, redirecting to auth");
      navigate("/auth");
      return;
    }
    if (role !== "ADMIN") {
      console.log("Not admin role, redirecting to home. Current role:", role);
      navigate("/");
      return;
    }
    console.log("Auth check passed");
  }, [isLoggedIn, role, navigate]);

  // Fetch analytics data from API
  const {
    data: analyticsData,
    loading,
    error,
  } = useAnalytics({
    period: timeRange,
  });

  // Transform API data for charts
  const chartData = useMemo(() => {
    if (!analyticsData) return null;

    // Transform submission trends for revenue chart (mock revenue calculation)
    const monthlyRevenue = analyticsData.submissionTrends.map((item) => ({
      name: formatDateShort(item.date).split(" ")[1],
      revenue: item.completedSubmissions * 500, // Assuming ₹500 per completion
    }));

    // Transform user growth for student registration chart
    const studentRegistrationData = analyticsData.userGrowth.map((item) => ({
      name: formatDateShort(item.date).split(" ")[1],
      Students: item.students,
      Evaluators: item.evaluators,
    }));

    // Transform subject performance for test sales chart
    const testSalesData = analyticsData.subjectPerformance.map((item) => ({
      name: item.subject,
      sales: item.totalSubmissions,
    }));

    // Transform submission status for evaluation status chart
    const evaluationStatusData = analyticsData.submissionsByStatus.map(
      (item) => ({
        name:
          item.status === "COMPLETED"
            ? "Evaluated"
            : item.status === "IN_PROGRESS"
              ? "In Progress"
              : "Pending",
        value: item.count,
      })
    );

    return {
      monthlyRevenue,
      studentRegistrationData,
      testSalesData,
      evaluationStatusData,
    };
  }, [analyticsData]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Error Loading Analytics
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-800">
              Analytics Dashboard
            </h1>
            <div className="flex gap-2">
              {/* <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select> */}

              {/* <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button> */}
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹
                  {analyticsData?.summary?.totalRevenue?.toLocaleString() ||
                    "0"}
                </div>
                <p className="text-xs text-green-600">+12% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalStudents?.toLocaleString() ||
                    "0"}
                </div>
                <p className="text-xs text-green-600">+8% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalSubmissions?.toLocaleString() ||
                    "0"}
                </div>
                <p className="text-xs text-green-600">+15% from last period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(analyticsData?.summary?.completionRate || 0)}%
                </div>
                <p className="text-xs text-amber-600">-2% from last period</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TabsTrigger value="revenue" className="flex gap-2">
                <LineChart className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="students" className="flex gap-2">
                <BarChart className="h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex gap-2">
                <BarChart className="h-4 w-4" />
                Test Series
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="flex gap-2">
                <PieChart className="h-4 w-4" />
                Evaluations
              </TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Monthly revenue generated from test series sales
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartLine
                      data={chartData?.monthlyRevenue || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`₹${value}`, "Revenue"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(207 72% 39%)"
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                    </RechartLine>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Registration Trend</CardTitle>
                  <CardDescription>
                    Monthly student registrations by CA level
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBar
                      data={chartData?.studentRegistrationData || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Students" fill="hsl(207 72% 39%)" name="Students" />
                      <Bar
                        dataKey="Evaluators"
                        fill="hsl(176 56% 46%)"
                        name="Evaluators"
                      />
                    </RechartBar>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Series Tab */}
            <TabsContent value="tests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Series Performance</CardTitle>
                  <CardDescription>Sales by test series</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBar
                      data={chartData?.testSalesData || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="hsl(207 72% 39%)" name="Submissions" />
                    </RechartBar>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluations Tab */}
            <TabsContent value="evaluations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Status</CardTitle>
                  <CardDescription>Overall evaluation status</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPie>
                      <Pie
                        data={chartData?.evaluationStatusData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={140}
                        fill="hsl(207 72% 39%)"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {(chartData?.evaluationStatusData || []).map(
                          (_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;
