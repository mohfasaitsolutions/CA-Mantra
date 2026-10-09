import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { formatDate } from '@/utils/dateUtils';

const EvaluatorDetail = () => {
  const { evaluatorId } = useParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Mock evaluator data
  const evaluator = {
    id: evaluatorId,
    name: 'Dr. Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Anytown, USA',
    joiningDate: '2022-08-15',
    totalEvaluations: 456,
    averageScore: 82.5,
    subjects: ['Accounting', 'Business Law'],
    activity: [
      { date: '2023-05-16', description: 'Evaluated Test Series 1 for John Doe' },
      { date: '2023-05-15', description: 'Reviewed Test Series 2 for Alice Smith' },
    ],
  };

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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Evaluator Details</h1>
          </div>
        </header>
        
        <main className="p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">{evaluator.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    {evaluator.email}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Phone className="h-4 w-4 mr-2" />
                    {evaluator.phone}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    {evaluator.address}
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joining Date: {formatDate(evaluator.joiningDate)}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Award className="h-4 w-4 mr-2" />
                    Total Evaluations: {evaluator.totalEvaluations}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Activity className="h-4 w-4 mr-2" />
                    Average Score: {evaluator.averageScore}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {evaluator.subjects.map((subject) => (
                    <Badge key={subject}>{subject}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                <ul className="space-y-2">
                  {evaluator.activity.map((item, index) => (
                    <li key={index} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <span className="font-medium">{item.description}</span>
                        <p className="text-gray-500 text-sm">{formatDate(item.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EvaluatorDetail;
