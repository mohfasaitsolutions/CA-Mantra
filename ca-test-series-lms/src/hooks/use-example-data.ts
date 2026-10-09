import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Example type for the data
export interface ExampleItem {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'completed';
  date: string;
}

// Query key constants
const QUERY_KEYS = {
  exampleItems: 'exampleItems',
};

/**
 * Hook to fetch example items
 */
export const useExampleItems = () => {
  return useQuery<ExampleItem[], Error>({
    queryKey: [QUERY_KEYS.exampleItems],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        { id: 1, name: 'Item 1', status: 'active' as const, date: '2023-01-01' },
        { id: 2, name: 'Item 2', status: 'pending' as const, date: '2023-01-02' },
        { id: 3, name: 'Item 3', status: 'completed' as const, date: '2023-01-03' },
      ];
    },
  });
};

/**
 * Hook to fetch a single example item by ID
 */
export const useExampleItem = (id: number) => {
  return useQuery<ExampleItem, Error>({
    queryKey: [QUERY_KEYS.exampleItems, id],
    queryFn: async () => {
      // Mock data for demonstration
      const items: ExampleItem[] = [
        { id: 1, name: 'Item 1', status: 'active', date: '2023-01-01' },
        { id: 2, name: 'Item 2', status: 'pending', date: '2023-01-02' },
        { id: 3, name: 'Item 3', status: 'completed', date: '2023-01-03' },
      ];

      const item = items.find(item => item.id === id);
      if (!item) {
        throw new Error(`Item with ID ${id} not found`);
      }

      return item;
    },
  });
};

/**
 * Hook to create a new example item
 */
export const useCreateExampleItem = () => {
  const queryClient = useQueryClient();

  return useMutation<ExampleItem, Error, Omit<ExampleItem, 'id'>>({
    mutationFn: async (newItem: Omit<ExampleItem, 'id'>) => {
      // Mock data for demonstration
      return {
        id: Math.floor(Math.random() * 1000),
        ...newItem,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.exampleItems] });
    },
  });
};

/**
 * Hook to update an existing example item
 */
export const useUpdateExampleItem = () => {
  const queryClient = useQueryClient();

  return useMutation<ExampleItem, Error, ExampleItem>({
    mutationFn: async (updatedItem: ExampleItem) => {
      // Mock data for demonstration
      return updatedItem;
    },
    onSuccess: (data: ExampleItem) => {
      queryClient.setQueryData([QUERY_KEYS.exampleItems, data.id], data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.exampleItems] });
    },
  });
};

/**
 * Hook to delete an example item
 */
export const useDeleteExampleItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (_id: number) => {
      // Mock data for demonstration - no return value needed
    },
    onSuccess: (_: void, id: number) => {
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.exampleItems, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.exampleItems] });
    },
  });
};