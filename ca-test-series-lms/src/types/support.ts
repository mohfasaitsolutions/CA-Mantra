
export type SupportTicket = {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'closed';
  submissionDate: string;
  screenshot: string | null;
  testId?: string | null;
};
