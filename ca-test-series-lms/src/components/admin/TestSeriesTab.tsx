
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestSeriesItem {
  id: string;
  title: string;
  price: number;
  sales: number;
  evaluationsPending: number;
  evaluationsComplete: number;
}

const defaultTestSeries: TestSeriesItem[] = [
  {
    id: '1',
    title: 'CA Foundation - Accounting Test Series 1',
    price: 999,
    sales: 245,
    evaluationsPending: 12,
    evaluationsComplete: 233
  },
  {
    id: '2',
    title: 'CA Foundation - Business Law Test Series',
    price: 899,
    sales: 180,
    evaluationsPending: 8,
    evaluationsComplete: 172
  },
  {
    id: '3',
    title: 'CA Intermediate - Advanced Accounting',
    price: 1299,
    sales: 156,
    evaluationsPending: 15,
    evaluationsComplete: 141
  }
];

const TestSeriesTab = ({ testSeries = defaultTestSeries }: { testSeries?: TestSeriesItem[] }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Series Management</CardTitle>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Create New Test
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2 pl-4">Title</th>
                  <th className="text-right p-2">Price (₹)</th>
                  <th className="text-right p-2">Sales</th>
                  <th className="text-right p-2">Pending</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testSeries.map((test) => (
                  <tr key={test.id} className="border-b">
                    <td className="p-2 pl-4">{test.title}</td>
                    <td className="text-right p-2">{test.price}</td>
                    <td className="text-right p-2">{test.sales}</td>
                    <td className="text-right p-2">{test.evaluationsPending}</td>
                    <td className="text-right p-2">{test.evaluationsComplete}</td>
                    <td className="text-right p-2 pr-4 space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Test Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Test Series</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Title</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="E.g., CA Foundation - Economics Test" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price (₹)</label>
                <input type="number" className="w-full p-2 border rounded" placeholder="499" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea className="w-full p-2 border rounded h-24" placeholder="Enter test description"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CA Level</label>
                <select className="w-full p-2 border rounded">
                  <option>Foundation</option>
                  <option>Intermediate</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Attempt Limit</label>
                <input type="number" className="w-full p-2 border rounded" placeholder="3" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Image</label>
                <input type="file" className="w-full p-2 border rounded" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Question Paper (PDF)</label>
                <input type="file" className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Create Test Series</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSeriesTab;
