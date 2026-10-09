
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock, CheckCircle } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { SupportTicket } from '@/types/support';
import { getStatusColor, getCategoryColor } from '@/utils/support-ticket-utils';

type TicketCardProps = {
  ticket: SupportTicket;
  onCardClick: () => void;
  onMarkAsClosed: (e: React.MouseEvent, id: string) => void;
};

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onCardClick, onMarkAsClosed }) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onCardClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center space-x-3 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold">{ticket.subject}</h3>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={`capitalize ${getCategoryColor(ticket.category)}`}>
                {ticket.category}
              </Badge>
            </div>
            <p className="text-gray-600 mb-2 truncate">{ticket.message}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span><User className="h-3 w-3 inline mr-1" />{ticket.studentName}</span>
              <span>•</span>
              <span><Clock className="h-3 w-3 inline mr-1" />{formatDate(ticket.submissionDate)}</span>
              {ticket.screenshot && (
                <>
                  <span>•</span>
                  <span className="text-primary">📎 Screenshot attached</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {ticket.status !== 'closed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => onMarkAsClosed(e, ticket.id)}
                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Closed
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;
