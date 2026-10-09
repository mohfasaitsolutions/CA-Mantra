import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { getApiBaseUrl } from '@/lib/utils';

interface SupportTicket {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  testId?: string;
  createdAt: string;
  updatedAt: string;
  hasUnreadResponse: boolean;
  adminResponse?: {
    message: string;
    respondedAt: string;
    respondedBy: {
      fullName: string;
      email: string;
    };
  };
}

interface CreateTicketData {
  subject: string;
  category: string;
  priority: string;
  description: string;
  testId?: string;
}

interface UseSupportTicketsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
}

export const useSupportTickets = (options: UseSupportTicketsOptions = {}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
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

      const response = await fetch(
        `${getApiBaseUrl()}/students/support-tickets?${queryParams.toString()}`,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.page, options.pageSize, options.status, options.category, token, isAuthenticated]);

  const createTicket = useCallback(async (ticketData: CreateTicketData) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${getApiBaseUrl()}/students/support-tickets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }

      const data = await response.json();
      
      // Refresh the tickets list
      await fetchTickets();
      
      return data.ticket;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  }, [token, isAuthenticated, fetchTickets]);

  const getTicketDetails = useCallback(async (ticketId: string) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${getApiBaseUrl()}/students/support-tickets/${ticketId}`,
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

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    pagination,
    createTicket,
    getTicketDetails,
    refetch: fetchTickets,
  };
};
