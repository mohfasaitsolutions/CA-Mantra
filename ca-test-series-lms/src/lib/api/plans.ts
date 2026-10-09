import apiClient from './client';

export interface TestSeriesItem {
    testSeriesId: string;
    price: number;
    addedAt?: string;
    testSeries?: {
        _id: string;
        title: string;
        description?: string;
        price: number;
        isActive: boolean;
        thumbnailUrl?: string;
        caLevel: string;
        totalTests?: number;
    };
}

export interface Plan {
    id: string;
    _id?: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    displayOrder: number;
    isActive: boolean;
    testSeriesItems?: TestSeriesItem[];
    testSeriesCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePlanData {
    name: string;
    description?: string;
    thumbnailUrl?: string;
    displayOrder?: number;
    testSeriesItems?: Array<{
        testSeriesId: string;
        price: number;
    }>;
}

export interface UpdatePlanData {
    name?: string;
    description?: string;
    thumbnailUrl?: string;
    displayOrder?: number;
    isActive?: boolean;
}

export interface GetPlansParams {
    includeInactive?: boolean;
}

export const plansApi = {
    // Get all plans
    getAll: async (params: GetPlansParams = {}): Promise<{ plans: Plan[] }> => {
        const response = await apiClient.get('/plans', { params });
        return response.data;
    },

    // Get a specific plan by ID
    getById: async (id: string): Promise<{ plan: Plan }> => {
        const response = await apiClient.get(`/plans/${id}`);
        return response.data;
    },

    // Create a new plan (admin only)
    create: async (data: CreatePlanData): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.post('/plans', data);
        return response.data;
    },

    // Update a plan (admin only)
    update: async (id: string, data: UpdatePlanData): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.put(`/plans/${id}`, data);
        return response.data;
    },

    // Toggle plan active status (admin only)
    toggleStatus: async (id: string): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.put(`/plans/${id}/toggle-status`);
        return response.data;
    },

    // Delete a plan (admin only)
    delete: async (id: string): Promise<{ message: string; testSeriesUpdated: number }> => {
        const response = await apiClient.delete(`/plans/${id}`);
        return response.data;
    },

    // Add test series to plan (admin only)
    addTestSeries: async (planId: string, testSeriesId: string, price: number): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.post(`/plans/${planId}/test-series`, { testSeriesId, price });
        return response.data;
    },

    // Remove test series from plan (admin only)
    removeTestSeries: async (planId: string, testSeriesId: string): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.delete(`/plans/${planId}/test-series/${testSeriesId}`);
        return response.data;
    },

    // Update test series price in plan (admin only)
    updateTestSeriesPrice: async (planId: string, testSeriesId: string, price: number): Promise<{ plan: Plan; message: string }> => {
        const response = await apiClient.put(`/plans/${planId}/test-series/${testSeriesId}/price`, { price });
        return response.data;
    },
};

