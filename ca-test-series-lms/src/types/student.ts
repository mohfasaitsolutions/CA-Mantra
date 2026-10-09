
export interface Student {
  id: string;
  name: string;
  email: string;
  caLevel: 'Foundation' | 'Intermediate' | 'Final';
  registrationDate: string;
  testsCompleted: number;
  averageScore: number;
  status: 'active' | 'inactive';
  phone: string;
  location: string;
  testsPurchased: number;
}
