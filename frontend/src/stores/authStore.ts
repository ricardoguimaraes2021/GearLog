import { create } from 'zustand';
import { api } from '@/services/api';
import type { User } from '@/types';
import { useNotificationStore } from './notificationStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
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
  isInitializing: false,

  login: async (email: string, password: string) => {
    // Prevent multiple simultaneous login attempts
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true });
    try {
      const { user, token } = await api.login(email, password);
      
      // Store token in localStorage first
      if (token) {
        localStorage.setItem('auth_token', token);
      }
      
      // Store user in localStorage for Echo initialization
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      
      set({ user, token, isAuthenticated: true, isLoading: false, isInitializing: false });
      
      // Initialize Echo for real-time notifications (non-blocking)
      if (token) {
        try {
          useNotificationStore.getState().initializeEcho(token);
          // Fetch unread count in background, don't wait for it
          useNotificationStore.getState().fetchUnreadCount().catch(err => {
            console.warn('Failed to fetch unread count:', err);
          });
        } catch (echoError) {
          // Don't fail login if Echo fails (e.g., Pusher not configured)
          console.warn('Failed to initialize Echo:', echoError);
        }
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
      localStorage.removeItem('auth_user');
    }
  },

  fetchUser: async () => {
    try {
      const user = await api.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Store user in localStorage for Echo initialization
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      throw error; // Re-throw to let initialize handle it
    }
  },

  initialize: async () => {
    // Prevent multiple simultaneous initializations
    if (get().isInitializing || get().isLoading) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, isInitializing: false });
      return;
    }

    set({ isInitializing: true, isLoading: true, token });
    try {
      await get().fetchUser();
      
      // Initialize Echo if user is authenticated
      if (get().isAuthenticated && token) {
        try {
          useNotificationStore.getState().initializeEcho(token);
          useNotificationStore.getState().fetchUnreadCount().catch(() => {
            // Ignore errors
          });
        } catch (error) {
          // Ignore Echo initialization errors
          console.warn('Failed to initialize Echo:', error);
        }
      }
    } catch (error) {
      // If fetchUser fails, clear auth state
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitializing: false });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      set({ isInitializing: false });
    }
  },
}));

