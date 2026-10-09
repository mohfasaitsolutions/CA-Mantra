import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import apiClient from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [data, setData] = useState<{
    totalStudents: number;
    totalEvaluators: number;
    pendingEvaluations: number;
    completedEvaluations: number;
    totalEvaluationsThisWeek: number;
    testSeriesSales: { name: string; value: number }[];
    evaluationStatus: { name: string; value: number; fill: string }[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/admin/dashboard");
        if (!mounted) return;
        setData(data);
      } catch (err: unknown) {
        if (!mounted) return;
        const e = err as { response?: { data?: { message?: string } } };
        toast({
          title: "Failed to load dashboard",
          description: e?.response?.data?.message || "Please try again",
          variant: "destructive",
        });
      } finally {
        // no-op
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const salesData = useMemo(() => data?.testSeriesSales || [], [data]);
  const statusData = useMemo(() => data?.evaluationStatus || [], [data]);
  const statusTotal = useMemo(
    () => statusData.reduce((sum, d) => sum + (d?.value || 0), 0),
    [statusData]
  );

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
                Admin Dashboard
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.totalStudents?.toLocaleString?.() || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">&nbsp;</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Evaluators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.totalEvaluators || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">&nbsp;</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {data?.pendingEvaluations || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Completed Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {(data?.completedEvaluations || 0).toLocaleString()}
                ̰ </div>
                <p className="text-xs text-green-600 mt-1">&nbsp;</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  This Week Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {data?.totalEvaluationsThisWeek || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Series Sales</CardTitle>
                <CardDescription>
                  Monthly revenue from test series sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`${value}`, "Count"]}
                    />
                    <Bar dataKey="value" fill="hsl(207 72% 39%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evaluation Status</CardTitle>
                <CardDescription>
                  Current status of all evaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusTotal > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusData.map((entry, idx) => (
                            <Cell
                              key={`slice-${idx}`}
                              fill={
                                entry.fill ||
                                ["hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"][idx % 3]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(
                            value: number,
                            name: string,
                            props: { payload?: { name?: string } }
                          ) => [
                              `${value}`,
                              props?.payload?.name || name || "Value",
                            ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Custom Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {statusData.map((entry, idx) => (
                        <div key={`legend-${idx}`} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                entry.fill ||
                                ["hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"][idx % 3],
                            }}
                          />
                          <span className="text-sm text-gray-600">
                            {entry.name}: <span className="font-semibold">{entry.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
                    No evaluation data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
