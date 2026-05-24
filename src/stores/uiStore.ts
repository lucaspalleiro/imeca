import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // TV / Kiosk / War Room Mode Configurations
  tvMode: boolean;
  setTvMode: (enabled: boolean) => void;
  tvRotationInterval: number; // in seconds
  setTvRotationInterval: (interval: number) => void;
  tvRotationPaused: boolean;
  setTvRotationPaused: (paused: boolean) => void;
  currentTvPanel: number;
  setCurrentTvPanel: (index: number) => void;
  tvPanelsCount: number;
  nextTvPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  tvMode: false,
  setTvMode: (enabled) => set((state) => {
    // If TV Mode is enabled, collapse sidebar to maximize workspace
    const sidebarState = enabled ? false : state.sidebarOpen;
    return { tvMode: enabled, sidebarOpen: sidebarState };
  }),
  tvRotationInterval: 15, // default to 15 seconds
  setTvRotationInterval: (interval) => set({ tvRotationInterval: interval }),
  tvRotationPaused: false,
  setTvRotationPaused: (paused) => set({ tvRotationPaused: paused }),
  currentTvPanel: 0,
  setCurrentTvPanel: (index) => set({ currentTvPanel: index }),
  tvPanelsCount: 4, // 0: Vista General, 1: Alertas y Operaciones, 2: Pulso Financiero, 3: Horas Hombre
  nextTvPanel: () => set((state) => ({
    currentTvPanel: (state.currentTvPanel + 1) % state.tvPanelsCount
  })),
}));
