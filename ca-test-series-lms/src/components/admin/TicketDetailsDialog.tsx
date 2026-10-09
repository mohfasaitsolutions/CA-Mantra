import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportTicket } from '@/types/support';
import { getCategoryColor } from '@/utils/support-ticket-utils';

type TicketDetailsDialogProps = {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
};

const TicketDetailsDialog: React.FC<TicketDetailsDialogProps> = ({ ticket, isOpen, onClose }) => {
  if (!ticket) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription>
            From: {ticket.studentName} ({ticket.studentEmail}) | Submitted: {formatDate(ticket.submissionDate)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none text-gray-800">
            <p>{ticket.message}</p>
          </div>
          {ticket.category && (
            <div className="mt-2">
              <h4 className="font-medium mb-2 text-gray-900">Category</h4>
              <Badge variant="outline" className={`capitalize ${getCategoryColor(ticket.category)}`}>
                {ticket.category}
              </Badge>
            </div>
          )}
          {ticket.testId && (
            <div className="mt-2">
              <h4 className="font-medium mb-2 text-gray-900">Related Test ID</h4>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded-md">{ticket.testId}</p>
            </div>
          )}
          {ticket.screenshot && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-gray-900">Screenshot</h4>
              <Button asChild>
                <a href={ticket.screenshot} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download Screenshot
                </a>
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button asChild>
            <a href={`mailto:${ticket.studentEmail}?subject=RE: ${ticket.subject}`}>
              <Mail className="h-4 w-4 mr-2" />
              Reply via Email
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailsDialog;
