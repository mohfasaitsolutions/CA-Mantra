
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const EvaluationSummary = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Evaluation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="font-medium flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              Completed This Month
            </h3>
            <p className="text-2xl font-bold mt-2 text-green-800">15</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800">Average Score Given</h3>
            <p className="text-2xl font-bold mt-2 text-blue-800">78.5%</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <h3 className="font-medium text-yellow-800">Revision Rate</h3>
            <p className="text-2xl font-bold mt-2 text-yellow-800">5%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationSummary;
