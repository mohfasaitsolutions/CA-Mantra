import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { getApiBaseUrl } from '@/lib/utils';

export interface SupportTicketWithDetails {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  testId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  student: {
    fullName: string;
    email: string;
    caLevel: string;
  };
  testSeries?: {
    id: string;
    title: string;
    subject: string;
  };
  adminResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: {
      fullName: string;
      email: string;
    };
  };
  needsAdminResponse: boolean;
}

type SupportTicket = SupportTicketWithDetails;

interface AdminSupportTicketsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const useAdminSupportTickets = (options: AdminSupportTicketsOptions = {}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const [summary, setSummary] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    urgentTickets: 0,
    highPriorityTickets: 0,
    needsAttention: 0
  });
  const { token, isAuthenticated } = useAuthStore();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.pageSize) queryParams.append('pageSize', options.pageSize.toString());
      if (options.status) queryParams.append('status', options.status);
      if (options.category) queryParams.append('category', options.category);
      if (options.priority) queryParams.append('priority', options.priority);
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

      const response = await fetch(
        `${getApiBaseUrl()}/admin/support-tickets?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`);
      }

      const data = await response.json();
      setTickets(data.data);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    options.page,
    options.pageSize,
    options.status,
    options.category,
    options.priority,
    options.sortBy,
    options.sortOrder,
    token,
    isAuthenticated
  ]);

  const getTicketDetails = useCallback(async (ticketId: string) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${getApiBaseUrl()}/admin/support-tickets/${ticketId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket details: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }, [token, isAuthenticated]);

  const respondToTicket = useCallback(async (ticketId: string, message: string, status?: string) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${getApiBaseUrl()}/admin/support-tickets/${ticketId}/respond`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to respond to ticket');
      }

      const data = await response.json();
      
      // Refresh the tickets list
      await fetchTickets();
      
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }, [token, isAuthenticated, fetchTickets]);

  const updateTicketStatus = useCallback(async (ticketId: string, status: string) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${getApiBaseUrl()}/admin/support-tickets/${ticketId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ticket status');
      }

      const data = await response.json();
      
      // Refresh the tickets list
      await fetchTickets();
      
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }, [token, isAuthenticated, fetchTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    pagination,
    summary,
    getTicketDetails,
    respondToTicket,
    updateTicketStatus,
    refetch: fetchTickets,
  };
};
