import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Define the store state type
interface ExampleState {
  // UI preferences
  sidebarOpen: boolean;
  viewMode: 'list' | 'grid';
  
  // User preferences
  itemsPerPage: number;
  sortOrder: 'asc' | 'desc';
  sortField: string;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setViewMode: (mode: 'list' | 'grid') => void;
  setItemsPerPage: (count: number) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSortField: (field: string) => void;
}

// Create the store
export const useExampleStore = create<ExampleState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        sidebarOpen: true,
        viewMode: 'list',
        itemsPerPage: 10,
        sortOrder: 'asc',
        sortField: 'name',
        
        // Actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setViewMode: (mode) => set({ viewMode: mode }),
        setItemsPerPage: (count) => set({ itemsPerPage: count }),
        setSortOrder: (order) => set({ sortOrder: order }),
        setSortField: (field) => set({ sortField: field }),
      }),
      {
        name: 'example-store', // unique name for localStorage
      }
    )
  )
);