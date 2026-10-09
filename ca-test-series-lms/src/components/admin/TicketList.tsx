
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { SupportTicket } from '@/types/support';
import TicketCard from './TicketCard';

type TicketListProps = {
  tickets: SupportTicket[];
  onTicketSelect: (ticket: SupportTicket) => void;
  onMarkAsClosed: (e: React.MouseEvent, id: string) => void;
};

const TicketList: React.FC<TicketListProps> = ({ tickets, onTicketSelect, onMarkAsClosed }) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
        <p className="text-gray-600">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onCardClick={() => onTicketSelect(ticket)}
          onMarkAsClosed={onMarkAsClosed}
        />
      ))}
    </div>
  );
};

export default TicketList;
