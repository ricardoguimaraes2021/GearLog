import { create } from 'zustand';
import { api } from '@/services/api';
import type { AssetAssignment, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

interface AssignmentState {
  assignments: AssetAssignment[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
  isLoading: boolean;
  checkoutAsset: (data: { product_id: number; employee_id: number; notes?: string }) => Promise<AssetAssignment>;
  checkinAsset: (assignmentId: number, data: { condition_on_return?: string; product_status?: string; notes?: string }) => Promise<AssetAssignment>;
  fetchHistoryByEmployee: (employeeId: number, page?: number) => Promise<void>;
  fetchHistoryByAsset: (productId: number, page?: number) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  pagination: null,
  isLoading: false,

  checkoutAsset: async (data) => {
    try {
      const assignment = await api.checkoutAsset(data);
      toast.success('Asset assigned successfully');
      return assignment;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign asset');
      throw error;
    }
  },

  checkinAsset: async (assignmentId, data) => {
    try {
      const assignment = await api.checkinAsset(assignmentId, data);
      toast.success('Asset returned successfully');
      return assignment;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to return asset');
      throw error;
    }
  },

  fetchHistoryByEmployee: async (employeeId: number, page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.getAssignmentHistoryByEmployee(employeeId);
      set({
        assignments: response.data,
        pagination: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch assignment history');
      throw error;
    }
  },

  fetchHistoryByAsset: async (productId: number, page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.getAssignmentHistoryByAsset(productId);
      set({
        assignments: response.data,
        pagination: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch assignment history');
      throw error;
    }
  },
}));

