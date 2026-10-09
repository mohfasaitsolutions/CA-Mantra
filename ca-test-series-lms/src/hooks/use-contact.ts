import { useState } from 'react';
import { getApiBaseUrl } from '../lib/utils';

interface ContactFormData {
  fullName: string;
  email: string;
  mobile: string;
  subject?: string;
  message: string;
}

interface ContactResponse {
  message: string;
  contactId: string;
}

export const useContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const submitContactForm = async (formData: ContactFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ContactResponse = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        return true;
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.message || 'Failed to submit contact form');
        return false;
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again later.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  return {
    isSubmitting,
    submitStatus,
    errorMessage,
    submitContactForm,
    resetForm,
  };
};

interface Enquiry {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  message: string;
  subject?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESPONDED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  adminResponse?: {
    message: string;
    respondedBy: {
      fullName: string;
      email: string;
    };
    respondedAt: string;
  };
  adminNotes: Array<{
    note: string;
    addedBy: {
      fullName: string;
    };
    addedAt: string;
  }>;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    fullName: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnquiriesResponse {
  enquiries: Enquiry[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics: {
    totalEnquiries: number;
    newEnquiries: number;
    inProgressEnquiries: number;
    respondedEnquiries: number;
    closedEnquiries: number;
    resolvedEnquiries: number;
    pendingEnquiries: number;
    highPriorityEnquiries: number;
  };
}

interface EnquiriesFilters {
  search: string;
  status: string;
  priority: string;
  isResolved: string;
  startDate?: string;
  endDate?: string;
}

export const useEnquiriesManagement = () => {
  const [loading, setLoading] = useState(false);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statistics, setStatistics] = useState({
    totalEnquiries: 0,
    newEnquiries: 0,
    inProgressEnquiries: 0,
    respondedEnquiries: 0,
    closedEnquiries: 0,
    resolvedEnquiries: 0,
    pendingEnquiries: 0,
    highPriorityEnquiries: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchEnquiries = async (page: number = 1, filters: EnquiriesFilters) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...filters,
      });

      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: EnquiriesResponse = await response.json();
        setEnquiries(data.enquiries);
        setStatistics(data.statistics);
        setPagination(data.pagination);
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to fetch enquiries' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while fetching enquiries' };
    } finally {
      setLoading(false);
    }
  };

  const getEnquiryDetails = async (enquiryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries/${enquiryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to fetch enquiry details' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while fetching enquiry details' };
    }
  };

  const respondToEnquiry = async (enquiryId: string, message: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries/${enquiryId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to respond to enquiry' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while responding to enquiry' };
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, status: string, priority?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries/${enquiryId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, priority }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to update enquiry status' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while updating enquiry status' };
    }
  };

  const addEnquiryNote = async (enquiryId: string, note: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries/${enquiryId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to add note' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while adding note' };
    }
  };

  const deleteEnquiry = async (enquiryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/admin/enquiries/${enquiryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to delete enquiry' };
      }
    } catch (error) {
      return { success: false, error: 'Network error while deleting enquiry' };
    }
  };

  return {
    loading,
    enquiries,
    statistics,
    pagination,
    fetchEnquiries,
    getEnquiryDetails,
    respondToEnquiry,
    updateEnquiryStatus,
    addEnquiryNote,
    deleteEnquiry,
  };
};
