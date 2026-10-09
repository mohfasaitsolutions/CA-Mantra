import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  
  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(devtools((set) => ({
  // Sidebar state
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  
  // Modal states
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  
  // Theme
  theme: 'light',
  setTheme: (theme) => set({ theme }),
})));