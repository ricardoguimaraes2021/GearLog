import { create } from 'zustand';
import { api } from '@/services/api';
import type { DashboardData } from '@/types';

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getDashboard();
      set({ data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

