import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: false,
  theme: 'light',

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
