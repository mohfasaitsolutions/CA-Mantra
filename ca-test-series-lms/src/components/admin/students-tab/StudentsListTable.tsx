
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  caLevel: string;
  testsPurchased: number;
  testsAttempted: number;
  recentTests: any[];
}

interface StudentsListTableProps {
  students: Student[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onViewStudent: (student: Student) => void;
}

const StudentsListTable: React.FC<StudentsListTableProps> = ({
  students,
  searchTerm,
  setSearchTerm,
  onViewStudent,
}) => {
  const filteredStudents = students.filter(
    student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students Management</CardTitle>
        <div className="flex items-center border rounded-md p-1 px-2">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <Input 
            type="text" 
            placeholder="Search students..." 
            className="border-0 focus:outline-none text-sm" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 pl-4">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">CA Level</th>
                <th className="text-right p-2">Tests Purchased</th>
                <th className="text-right p-2">Tests Attempted</th>
                <th className="text-right p-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b">
                  <td className="p-2 pl-4">{student.name}</td>
                  <td className="p-2">{student.email}</td>
                  <td className="p-2">{student.caLevel}</td>
                  <td className="text-right p-2">{student.testsPurchased}</td>
                  <td className="text-right p-2">{student.testsAttempted}</td>
                  <td className="text-right p-2 pr-4 space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewStudent(student)}
                    >
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Block</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentsListTable;
