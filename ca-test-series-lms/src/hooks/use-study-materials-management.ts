import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getApiBaseUrl } from '@/lib/utils';

export interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  caLevel: string;
  type: 'FREE' | 'PAID';
  price: number;
  discountPrice: number;
  effectivePrice: number;
  discountPercentage: number;
  fileInfo: {
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
  };
  readableFileSize: string;
  isActive: boolean;
  featured: boolean;
  downloadCount: number;
  purchaseCount: number;
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
  uploadedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

export interface StudyMaterialFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  subject?: string;
  caLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  isActive?: string;
}

export interface StudyMaterialsResponse {
  materials: StudyMaterial[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalMaterials: number;
    freeMaterials: number;
    paidMaterials: number;
    activeMaterials: number;
    inactiveMaterials: number;
  };
}

export interface StudyMaterialCreateData {
  title: string;
  description: string;
  category: string;
  subject: string;
  caLevel: string;
  type: 'FREE' | 'PAID';
  price?: number;
  discountPrice?: number;
  tags?: string[];
  featured?: boolean;
  fileInfo: {
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    url: string;
  };
}

export interface StudyMaterialAnalytics {
  overview: {
    totalMaterials: number;
    freeMaterials: number;
    paidMaterials: number;
    activeMaterials: number;
    featuredMaterials: number;
    inactiveMaterials: number;
  };
  distribution: {
    categories: Array<{ _id: string; count: number }>;
    subjects: Array<{ _id: string; count: number }>;
    levels: Array<{ _id: string; count: number }>;
  };
  topDownloaded: Array<{
    _id: string;
    title: string;
    downloadCount: number;
    type: string;
    uploadedBy: { fullName: string };
  }>;
  revenue: {
    total: number;
    totalPurchases: number;
    averageOrderValue: number;
    monthlyTrend: Array<{
      _id: { year: number; month: number };
      revenue: number;
      purchases: number;
    }>;
  };
}

interface PurchaseStats {
  totalPurchases: number;
  completedPurchases: number;
  revenue: number;
}

interface StudyMaterialWithStats extends StudyMaterial {
  purchaseStats?: PurchaseStats;
}

export const useStudyMaterialsManagement = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [pagination, setPagination] = useState<StudyMaterialsResponse['pagination'] | null>(null);
  const [summary, setSummary] = useState<StudyMaterialsResponse['summary'] | null>(null);
  const [analytics, setAnalytics] = useState<StudyMaterialAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();

  const fetchMaterials = useCallback(async (filters: StudyMaterialFilters = {}) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${getApiBaseUrl()}/admin/study-materials?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StudyMaterialsResponse = await response.json();
      setMaterials(data.materials);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch study materials');
      console.error('Error fetching study materials:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/study-materials/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StudyMaterialAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [token]);

  const createMaterial = useCallback(async (materialData: StudyMaterialCreateData): Promise<StudyMaterial> => {
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${getApiBaseUrl()}/admin/study-materials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create study material');
    }

    const data = await response.json();
    // Refresh handled by component
    return data.material;
  }, [token]);

  const updateMaterial = useCallback(async (id: string, updates: Partial<StudyMaterialCreateData>): Promise<StudyMaterial> => {
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${getApiBaseUrl()}/admin/study-materials/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update study material');
    }

    const data = await response.json();
    // Refresh handled by component
    return data.material;
  }, [token]);

  const deleteMaterial = useCallback(async (id: string): Promise<void> => {
    if (!token) throw new Error('Authentication required');

    // Optimistically remove from UI
    const originalMaterials = materials;
    setMaterials(prev => prev.filter(m => m._id !== id));

    const response = await fetch(`${getApiBaseUrl()}/admin/study-materials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Revert optimistic update on error
      setMaterials(originalMaterials);
      throw new Error(errorData.message || 'Failed to delete study material');
    }

    // Refresh handled by component
  }, [token, materials]);

  const toggleMaterialStatus = useCallback(async (id: string): Promise<void> => {
    if (!token) throw new Error('Authentication required');

    // Optimistically update UI
    const currentMaterial = materials.find(m => m._id === id);
    if (currentMaterial) {
      setMaterials(prev => prev.map(m => 
        m._id === id ? { ...m, isActive: !m.isActive } : m
      ));
    }

    const response = await fetch(`${getApiBaseUrl()}/admin/study-materials/${id}/toggle-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Revert optimistic update on error
      if (currentMaterial) {
        setMaterials(prev => prev.map(m => 
          m._id === id ? { ...m, isActive: currentMaterial.isActive } : m
        ));
      }
      throw new Error(errorData.message || 'Failed to toggle material status');
    }

    // Refresh handled by component
  }, [token, materials]);

  const getMaterialDetails = useCallback(async (id: string): Promise<StudyMaterialWithStats> => {
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${getApiBaseUrl()}/admin/study-materials/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch material details');
    }

    const data = await response.json();
    return data;
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMaterials();
      fetchAnalytics();
    }
  }, [token, fetchMaterials, fetchAnalytics]); // Initial load only

  const refetch = useCallback(async (filters: StudyMaterialFilters = {}) => {
    await fetchMaterials(filters);
    await fetchAnalytics();
  }, [fetchMaterials, fetchAnalytics]);

  return {
    materials,
    pagination,
    summary,
    analytics,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleMaterialStatus,
    getMaterialDetails,
    fetchAnalytics,
    refetch,
  };
};
