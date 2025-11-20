import { create } from 'zustand';
import { api } from '@/services/api';
import type { CompanyWithStats, CompanyStatistics, CompanyLogs } from '@/types';

interface AdminStore {
  companies: CompanyWithStats[];
  currentCompany: CompanyWithStats | null;
  companyStats: CompanyStatistics | null;
  companyLogs: CompanyLogs | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
  filters: {
    search?: string;
    plan_type?: 'FREE' | 'PRO' | 'ENTERPRISE';
    is_active?: boolean;
    suspended?: boolean;
  };

  // Actions
  fetchCompanies: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    plan_type?: 'FREE' | 'PRO' | 'ENTERPRISE';
    is_active?: boolean;
    suspended?: boolean;
  }) => Promise<void>;
  fetchCompany: (id: number) => Promise<void>;
  fetchCompanyLogs: (id: number) => Promise<void>;
  suspendCompany: (id: number) => Promise<void>;
  activateCompany: (id: number) => Promise<void>;
  updateCompanyPlan: (id: number, plan: {
    plan_type: 'FREE' | 'PRO' | 'ENTERPRISE';
    max_users?: number;
    max_products?: number;
    max_tickets?: number;
  }) => Promise<void>;
  setFilters: (filters: {
    search?: string;
    plan_type?: 'FREE' | 'PRO' | 'ENTERPRISE';
    is_active?: boolean;
    suspended?: boolean;
  }) => void;
  clearError: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  companies: [],
  currentCompany: null,
  companyStats: null,
  companyLogs: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},

  fetchCompanies: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const mergedParams = { ...get().filters, ...params };
      const response = await api.getCompanies(mergedParams);
      set({
        companies: response.data,
        pagination: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to fetch companies',
        isLoading: false,
      });
    }
  },

  fetchCompany: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getAdminCompany(id);
      // Ensure owner is included in company object (backend may return it separately)
      const companyWithOwner = {
        ...response.company,
        owner: response.company.owner || response.owner || null,
        users_with_roles: (response as any).users_with_roles || [],
      };
      set({
        currentCompany: companyWithOwner,
        companyStats: response.statistics,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to fetch company',
        isLoading: false,
      });
    }
  },

  fetchCompanyLogs: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await api.getCompanyLogs(id);
      set({
        companyLogs: logs,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to fetch company logs',
        isLoading: false,
      });
    }
  },

  suspendCompany: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.suspendCompany(id);
      // Refresh companies list
      await get().fetchCompanies();
      // If current company is suspended, refresh it
      if (get().currentCompany?.id === id) {
        await get().fetchCompany(id);
      }
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to suspend company',
        isLoading: false,
      });
    }
  },

  activateCompany: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.activateCompany(id);
      // Refresh companies list
      await get().fetchCompanies();
      // If current company is activated, refresh it
      if (get().currentCompany?.id === id) {
        await get().fetchCompany(id);
      }
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to activate company',
        isLoading: false,
      });
    }
  },

  updateCompanyPlan: async (id: number, plan: {
    plan_type: 'FREE' | 'PRO' | 'ENTERPRISE';
    max_users?: number;
    max_products?: number;
    max_tickets?: number;
  }) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateCompanyPlan(id, plan);
      // Refresh companies list
      await get().fetchCompanies();
      // If current company is updated, refresh it
      if (get().currentCompany?.id === id) {
        await get().fetchCompany(id);
      }
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || error.message || 'Failed to update company plan',
        isLoading: false,
      });
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },
}));

