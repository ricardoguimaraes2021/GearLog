import { create } from 'zustand';
import { api } from '@/services/api';
import type { Department } from '@/types';
import { toast } from 'sonner';

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  isLoading: boolean;
  fetchDepartments: () => Promise<void>;
  fetchDepartment: (id: number) => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<Department>;
  updateDepartment: (id: number, data: Partial<Department>) => Promise<Department>;
  deleteDepartment: (id: number) => Promise<void>;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: [],
  currentDepartment: null,
  isLoading: false,

  fetchDepartments: async () => {
    set({ isLoading: true });
    try {
      const departments = await api.getDepartments();
      set({ departments, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch departments');
      throw error;
    }
  },

  fetchDepartment: async (id: number) => {
    set({ isLoading: true });
    try {
      const department = await api.getDepartment(id);
      set({ currentDepartment: department, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch department');
      throw error;
    }
  },

  createDepartment: async (data: Partial<Department>) => {
    try {
      const department = await api.createDepartment(data);
      toast.success('Department created successfully');
      await get().fetchDepartments();
      return department;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create department');
      throw error;
    }
  },

  updateDepartment: async (id: number, data: Partial<Department>) => {
    try {
      const department = await api.updateDepartment(id, data);
      toast.success('Department updated successfully');
      await get().fetchDepartments();
      if (get().currentDepartment?.id === id) {
        set({ currentDepartment: department });
      }
      return department;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update department');
      throw error;
    }
  },

  deleteDepartment: async (id: number) => {
    try {
      await api.deleteDepartment(id);
      toast.success('Department deleted successfully');
      await get().fetchDepartments();
      if (get().currentDepartment?.id === id) {
        set({ currentDepartment: null });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete department');
      throw error;
    }
  },
}));

