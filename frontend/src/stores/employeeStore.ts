import { create } from 'zustand';
import { api } from '@/services/api';
import type { Employee, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

interface EmployeeState {
  employees: Employee[];
  currentEmployee: Employee | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
  isLoading: boolean;
  filters: {
    search?: string;
    status?: string;
    department_id?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  };
  fetchEmployees: (page?: number) => Promise<void>;
  fetchEmployee: (id: number) => Promise<void>;
  createEmployee: (data: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (id: number, data: Partial<Employee>) => Promise<Employee>;
  deleteEmployee: (id: number) => Promise<void>;
  deactivateEmployee: (id: number) => Promise<void>;
  reactivateEmployee: (id: number) => Promise<void>;
  setFilters: (filters: Partial<EmployeeState['filters']>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  search: undefined,
  status: undefined,
  department_id: undefined,
  sort_by: 'created_at',
  sort_order: 'desc' as const,
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  currentEmployee: null,
  pagination: null,
  isLoading: false,
  filters: { ...defaultFilters },

  fetchEmployees: async (page = 1) => {
    set({ isLoading: true });
    try {
      const filters = get().filters;
      const response = await api.getEmployees({
        ...filters,
        page,
        per_page: 15,
      });
      set({
        employees: response.data,
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
      toast.error(error.response?.data?.error || 'Failed to fetch employees');
      throw error;
    }
  },

  fetchEmployee: async (id: number) => {
    set({ isLoading: true });
    try {
      const employee = await api.getEmployee(id);
      set({ currentEmployee: employee, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch employee');
      throw error;
    }
  },

  createEmployee: async (data: Partial<Employee>) => {
    try {
      const employee = await api.createEmployee(data);
      toast.success('Employee created successfully');
      await get().fetchEmployees();
      return employee;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create employee');
      throw error;
    }
  },

  updateEmployee: async (id: number, data: Partial<Employee>) => {
    try {
      const employee = await api.updateEmployee(id, data);
      toast.success('Employee updated successfully');
      await get().fetchEmployees();
      if (get().currentEmployee?.id === id) {
        set({ currentEmployee: employee });
      }
      return employee;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update employee');
      throw error;
    }
  },

  deleteEmployee: async (id: number) => {
    try {
      await api.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      await get().fetchEmployees();
      if (get().currentEmployee?.id === id) {
        set({ currentEmployee: null });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete employee');
      throw error;
    }
  },

  deactivateEmployee: async (id: number) => {
    try {
      await api.deactivateEmployee(id);
      toast.success('Employee deactivated successfully');
      await get().fetchEmployees();
      if (get().currentEmployee?.id === id) {
        await get().fetchEmployee(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to deactivate employee');
      throw error;
    }
  },

  reactivateEmployee: async (id: number) => {
    try {
      await api.reactivateEmployee(id);
      toast.success('Employee reactivated successfully');
      await get().fetchEmployees();
      if (get().currentEmployee?.id === id) {
        await get().fetchEmployee(id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reactivate employee');
      throw error;
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },
}));

