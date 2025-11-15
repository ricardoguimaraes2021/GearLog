import { create } from 'zustand';
import { api } from '@/services/api';
import type { Product, PaginatedResponse } from '@/types';

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
  isLoading: boolean;
  filters: {
    search?: string;
    category_id?: number;
    status?: string;
    min_quantity?: number;
    max_quantity?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  };
  fetchProducts: (page?: number) => Promise<void>;
  fetchProduct: (id: number) => Promise<void>;
  createProduct: (data: FormData) => Promise<Product>;
  updateProduct: (id: number, data: FormData) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  search: undefined,
  category_id: undefined,
  status: undefined,
  min_quantity: undefined,
  max_quantity: undefined,
  sort_by: 'created_at',
  sort_order: 'desc' as const,
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  currentProduct: null,
  pagination: null,
  isLoading: false,
  filters: { ...defaultFilters },

  fetchProducts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const filters = get().filters;
      const response = await api.getProducts({
        ...filters,
        page,
        per_page: 15,
      });
      set({
        products: response.data,
        pagination: {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProduct: async (id: number) => {
    set({ isLoading: true });
    try {
      const product = await api.getProduct(id);
      set({ currentProduct: product, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProduct: async (data: FormData) => {
    const product = await api.createProduct(data);
    await get().fetchProducts();
    return product;
  },

  updateProduct: async (id: number, data: FormData) => {
    const product = await api.updateProduct(id, data);
    await get().fetchProducts();
    if (get().currentProduct?.id === id) {
      set({ currentProduct: product });
    }
    return product;
  },

  deleteProduct: async (id: number) => {
    await api.deleteProduct(id);
    await get().fetchProducts();
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

