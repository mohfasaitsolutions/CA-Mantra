
import { Users, BookOpen, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStatsProps {
  totalTests: number;
  activeStudents: number;
  totalEvaluators: number;
  pendingEvaluations: number;
  completedEvaluations: number;
  revenue: number;
}

const AdminOverviewTab = ({ adminStats }: { adminStats: AdminStatsProps }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Test Series</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalTests}</div>
            <p className="text-xs text-gray-500">Total available test series</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.activeStudents}</div>
            <p className="text-xs text-gray-500">Students with at least one purchase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Evaluations Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.pendingEvaluations}</div>
            <p className="text-xs text-gray-500">Awaiting evaluator feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{adminStats.revenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Total sales revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Test Series Sales</h4>
              <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
                Chart Placeholder: Monthly Sales
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Evaluation Status</h4>
              <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
                Chart Placeholder: Evaluations Pending vs. Complete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <div className="mr-4">
                <Users className="h-8 w-8 text-ca-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">New student registration</p>
                <p className="text-xs text-gray-500">Ankit Patel joined 2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <div className="mr-4">
                <BookOpen className="h-8 w-8 text-ca-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">New test purchase</p>
                <p className="text-xs text-gray-500">15 new purchases in last 24 hours</p>
              </div>
            </div>

            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <div className="mr-4">
                <UserCheck className="h-8 w-8 text-ca-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Evaluations completed</p>
                <p className="text-xs text-gray-500">32 evaluations completed today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewTab;
