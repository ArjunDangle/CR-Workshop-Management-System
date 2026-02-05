import { create } from 'zustand';

// This interface tells TypeScript exactly what to expect in the store
interface UIState {
  isSidebarOpen: boolean;    // Mobile menu toggle (Show/Hide)
  isCollapsed: boolean;      // Desktop sidebar toggle (Wide/Narrow)
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleCollapse: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isCollapsed: false,
  
  // Logic for mobile toggle
  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),
  
  // Force close (used for mobile overlays)
  closeSidebar: () => set({ 
    isSidebarOpen: false 
  }),
  
  // Logic for desktop collapse/expand
  toggleCollapse: () => set((state) => ({ 
    isCollapsed: !state.isCollapsed 
  })),
}));