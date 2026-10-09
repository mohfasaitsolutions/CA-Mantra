
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentAnalytics = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold mb-2">Registration Trend</h4>
            <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
              Chart Placeholder: Monthly Registrations
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">CA Level Distribution</h4>
            <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">
              Chart Placeholder: Foundation vs Intermediate
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAnalytics;
