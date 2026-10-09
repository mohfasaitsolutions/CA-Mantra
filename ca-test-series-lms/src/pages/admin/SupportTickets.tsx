
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { SupportTicket } from '@/types/support';
import SupportFilters from '@/components/admin/SupportFilters';
import TicketList from '@/components/admin/TicketList';
import TicketDetailsDialog from '@/components/admin/TicketDetailsDialog';

const SupportTickets = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  // Mock support tickets data
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul.sharma@example.com',
      subject: 'Unable to access test series',
      message: 'I am unable to access the CA Foundation test series after payment.',
      category: 'technical',
      status: 'open',
      submissionDate: '2024-01-20',
      screenshot: '/images/screenshot-example.png'
    },
    {
      id: '2',
      studentName: 'Priya Patel',
      studentEmail: 'priya.patel@example.com',
      subject: 'Refund request',
      message: 'I would like to request a refund for the test series I purchased.',
      category: 'payment',
      status: 'open',
      submissionDate: '2024-01-19',
      screenshot: null
    },
    {
      id: '3',
      studentName: 'Aditya Verma',
      studentEmail: 'aditya.verma@example.com',
      subject: 'Evaluation delay',
      message: 'My test was submitted 2 weeks ago but still not evaluated.',
      category: 'test',
      status: 'open',
      submissionDate: '2024-01-18',
      screenshot: null,
      testId: 'CA-FN-ACCT-TS1-1004',
    },
    {
      id: '4',
      studentName: 'Anjali Singh',
      studentEmail: 'anjali.singh@example.com',
      subject: 'Login issues resolved',
      message: 'Thank you for helping me with the login problem.',
      category: 'account',
      status: 'closed',
      submissionDate: '2024-01-15',
      screenshot: null
    }
  ]);

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkAsClosed = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent dialog from opening when clicking button
    setSupportTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === id ? { ...ticket, status: 'closed' } : ticket
      )
    );
    setSelectedTicket(prev => prev && prev.id === id ? { ...prev, status: 'closed' } : prev);
    toast({
      title: "Ticket Closed",
      description: "The support ticket has been marked as closed.",
    });
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
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          <SupportFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            totalTickets={supportTickets.length}
            openTickets={supportTickets.filter(t => t.status === 'open').length}
            closedTickets={supportTickets.filter(t => t.status === 'closed').length}
          />
          
          <TicketList
            tickets={filteredTickets}
            onTicketSelect={setSelectedTicket}
            onMarkAsClosed={handleMarkAsClosed}
          />
        </main>
      </div>
      <TicketDetailsDialog
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
};

export default SupportTickets;
