
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, MoreHorizontal, Phone } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Student } from '@/types/student';

interface StudentCardProps {
  student: Student;
}

const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
              {student.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{student.name}</h3>
              <p className="text-gray-600">{student.email}</p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Phone className="h-4 w-4 mr-2 text-gray-400"/>
                {student.phone}
              </p>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span>{student.caLevel}</span>
                <span>•</span>
                <span>{student.location}</span>
                <span>•</span>
                <span>Joined {formatDate(student.registrationDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Tests Purchased</div>
              <div className="font-semibold">{student.testsPurchased}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Avg Score</div>
              <div className="font-semibold">{student.averageScore}%</div>
            </div>
            <Badge className={getStatusColor(student.status)}>
              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/admin/students/${student.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
