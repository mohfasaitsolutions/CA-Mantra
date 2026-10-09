import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/utils';

export interface PublicStudyMaterial {
  _id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  caLevel: string;
  type: 'FREE' | 'PAID';
  price?: number;
  discountPrice?: number;
  featured: boolean;
  tags: string[];
  purchaseCount?: number;
  readableFileSize: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStudyMaterialsResponse {
  materials: PublicStudyMaterial[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalMaterials: number;
    freeMaterials: number;
    paidMaterials: number;
    featuredMaterials: number;
  };
}

export interface StudyMaterialFilters {
  type?: 'all' | 'FREE' | 'PAID';
  category?: string;
  subject?: string;
  caLevel?: string;
  search?: string;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const usePublicStudyMaterials = () => {
  const [materials, setMaterials] = useState<PublicStudyMaterial[]>([]);
  const [pagination, setPagination] = useState<PublicStudyMaterialsResponse['pagination'] | null>(null);
  const [summary, setSummary] = useState<PublicStudyMaterialsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async (filters: StudyMaterialFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${getApiBaseUrl()}/students/public/study-materials?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PublicStudyMaterialsResponse = await response.json();
      setMaterials(data.materials);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch study materials');
      console.error('Error fetching public study materials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const refetch = useCallback((filters: StudyMaterialFilters = {}) => {
    fetchMaterials(filters);
  }, [fetchMaterials]);

  return {
    materials,
    pagination,
    summary,
    loading,
    error,
    refetch,
  };
};
