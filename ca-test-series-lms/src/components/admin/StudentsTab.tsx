
import { useState } from 'react';
import StudentsListTable from './students-tab/StudentsListTable';
import StudentAnalytics from './students-tab/StudentAnalytics';
import StudentDetailsDialog from './students-tab/StudentDetailsDialog';

interface Student {
  id: string;
  name: string;
  email: string;
  caLevel: string;
  testsPurchased: number;
  testsAttempted: number;
  recentTests: any[];
}

const StudentsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewStudentDialog, setViewStudentDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setViewStudentDialog(true);
  };

  const handleGrantRetake = (testId: string) => {
    console.log('Granting retake for test:', testId);
    // Add your retake logic here
  };

  // Mock student data
  const students: Student[] = [...Array(5)].map((_, i) => ({
    id: `STU${i + 1}`,
    name: `Student ${i + 1}`,
    email: `student${i + 1}@example.com`,
    caLevel: i % 2 === 0 ? 'Foundation' : 'Intermediate',
    testsPurchased: Math.floor(Math.random() * 5) + 1,
    testsAttempted: Math.floor(Math.random() * 4),
    recentTests: [
      {
        id: `TEST${i}1`,
        testName: 'CA Foundation - Accounting Test Series 1',
        dateAttempted: '2023-05-15',
        score: Math.floor(Math.random() * 40) + 60,
        status: 'Evaluated',
        evaluatorName: 'Rajesh Kumar'
      },
      {
        id: `TEST${i}2`,
        testName: 'CA Foundation - Business Law Test Series',
        dateAttempted: '2023-05-10',
        score: Math.floor(Math.random() * 40) + 60,
        status: i % 2 === 0 ? 'Evaluated' : 'Pending Evaluation',
        evaluatorName: i % 2 === 0 ? 'Priya Singh' : null
      }
    ]
  }));

  return (
    <div className="space-y-6">
      <StudentsListTable
        students={students}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onViewStudent={handleViewStudent}
      />

      <StudentAnalytics />

      <StudentDetailsDialog
        isOpen={viewStudentDialog}
        onClose={() => setViewStudentDialog(false)}
        student={selectedStudent}
        onGrantRetake={handleGrantRetake}
      />
    </div>
  );
};

export default StudentsTab;
