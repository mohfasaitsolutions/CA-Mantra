import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { plansApi, Plan, CreatePlanData, UpdatePlanData } from '@/lib/api/plans';

// Normalize _id to id
function normalizeId<T extends { _id?: string; id?: string }>(obj: T): T & { id: string } {
    return { ...obj, id: obj.id || obj._id || '' };
}

export function usePlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPlans = useCallback(async (includeInactive = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await plansApi.getAll({ includeInactive });
            const normalized = response.plans.map(normalizeId);
            setPlans(normalized);
            return normalized;
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to fetch plans';
            setError(message);
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    return { plans, isLoading, error, fetchPlans };
}

export function usePlansManagement() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const createPlan = useCallback(async (data: CreatePlanData): Promise<Plan | null> => {
        setIsLoading(true);
        try {
            const response = await plansApi.create(data);
            toast({
                title: 'Success',
                description: response.message || 'Plan created successfully',
            });
            return normalizeId(response.plan);
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to create plan';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const updatePlan = useCallback(async (id: string, data: UpdatePlanData): Promise<Plan | null> => {
        setIsLoading(true);
        try {
            const response = await plansApi.update(id, data);
            toast({
                title: 'Success',
                description: response.message || 'Plan updated successfully',
            });
            return normalizeId(response.plan);
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to update plan';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const togglePlanStatus = useCallback(async (id: string): Promise<Plan | null> => {
        setIsLoading(true);
        try {
            const response = await plansApi.toggleStatus(id);
            toast({
                title: 'Success',
                description: response.message || 'Plan status updated',
            });
            return normalizeId(response.plan);
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to toggle plan status';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const deletePlan = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await plansApi.delete(id);
            toast({
                title: 'Success',
                description: response.message || 'Plan deleted successfully',
            });
            return true;
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to delete plan';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    return {
        isLoading,
        createPlan,
        updatePlan,
        togglePlanStatus,
        deletePlan,
    };
}
