import { create } from 'zustand';
import { api } from '@/services/api';
import type { Category } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: { name: string }) => Promise<Category>;
  updateCategory: (id: number, data: { name: string }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async () => {
    set({ isLoading: true });
    try {
      const categories = await api.getCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCategory: async (data) => {
    const category = await api.createCategory(data);
    await get().fetchCategories();
    return category;
  },

  updateCategory: async (id, data) => {
    const category = await api.updateCategory(id, data);
    await get().fetchCategories();
    return category;
  },

  deleteCategory: async (id) => {
    await api.deleteCategory(id);
    await get().fetchCategories();
  },
}));

