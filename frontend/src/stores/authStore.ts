import { create } from 'zustand';
import { api } from '@/services/api';
import type { User } from '@/types';
import { useNotificationStore } from './notificationStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user, token } = await api.login(email, password);
      set({ user, token, isAuthenticated: true, isLoading: false });
      
      // Initialize Echo for real-time notifications
      if (token) {
        useNotificationStore.getState().initializeEcho(token);
        useNotificationStore.getState().fetchUnreadCount();
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Disconnect Echo
      useNotificationStore.getState().disconnectEcho();
      
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('auth_token');
    }
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('auth_token');
    }
  },

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await get().fetchUser();
      
      // Initialize Echo if user is authenticated
      if (get().isAuthenticated && token) {
        useNotificationStore.getState().initializeEcho(token);
        useNotificationStore.getState().fetchUnreadCount();
      }
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));

