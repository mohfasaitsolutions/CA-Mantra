
import { useState } from 'react';
import { Menu, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { Link } from 'react-router-dom';

const myTestSeries = [
  { id: '1', title: 'CA Foundation - Accounting Masterclass', totalTests: 12, completedTests: 8 },
  { id: '2', title: 'CA Intermediate - Law Challenge', totalTests: 8, completedTests: 8 },
  { id: '3', title: 'CA Foundation - Economics Drills', totalTests: 15, completedTests: 5 },
  { id: '4', title: 'CA Intermediate - Advanced Accounting', totalTests: 10, completedTests: 0 },
];

const TestSeriesStatus = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
              <h1 className="text-2xl font-bold text-gray-800">Test Series Status</h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTestSeries.map((series) => {
              const progress = series.totalTests > 0 ? (series.completedTests / series.totalTests) * 100 : 0;
              return (
                <Card key={series.id}>
                  <CardHeader>
                    <CardTitle>{series.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                          <span className="text-sm font-semibold text-ca-primary">{series.completedTests} / {series.totalTests} Tests</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/student/courses/${series.id}`}>
                          <BarChart2 className="mr-2 h-4 w-4" /> View Details & Analytics
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {myTestSeries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">You haven't purchased any test series yet.</p>
              <Button asChild className="mt-4">
                <Link to="/buy-now">Explore Marketplace</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TestSeriesStatus;
