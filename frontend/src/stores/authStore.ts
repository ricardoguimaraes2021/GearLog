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
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for token expiration events from API interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:token-expired', () => {
      set({ user: null, token: null, isAuthenticated: false });
    });
  }

  return {
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
      const { user, token, requires_onboarding } = await api.login(email, password);
      
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
      if (token && !requires_onboarding) {
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

  register: async (name: string, email: string, password: string) => {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true });
    try {
      const { user, token, requires_onboarding } = await api.register(name, email, password);
      
      if (token) {
        localStorage.setItem('auth_token', token);
      }
      
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      
      set({ user, token, isAuthenticated: true, isLoading: false, isInitializing: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // Prevent multiple simultaneous logout attempts
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true });
    
    try {
      // Call API logout (it handles cleanup even if it fails)
      await api.logout();
    } catch (error) {
      // Logout API might fail if token is invalid, but that's okay
      // The api.logout() method already handles cleanup
      console.warn('Logout API call had issues, but cleanup completed:', error);
    } finally {
      // Always ensure complete cleanup, regardless of API call result
      // Disconnect Echo first
      try {
        useNotificationStore.getState().disconnectEcho();
      } catch (echoError) {
        console.warn('Error disconnecting Echo:', echoError);
      }
      
      // Clear all auth state
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false,
        isInitializing: false 
      });
      
      // Ensure localStorage is cleared (api.logout() already does this, but be safe)
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
    } catch (error: any) {
      // If 401, token is invalid/expired - clear auth state
      if (error.response?.status === 401) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
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
      set({ isAuthenticated: false, isLoading: false, isInitializing: false, token: null, user: null });
      return;
    }

    // Set token immediately so API calls can use it
    set({ isInitializing: true, isLoading: true, token });
    
    try {
      // Try to restore user from localStorage first for faster UI
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({ user, isAuthenticated: true });
        } catch (e) {
          // Invalid stored user, will fetch fresh
        }
      }

      // Validate token by fetching current user
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
    } catch (error: any) {
      // If fetchUser fails (401, network error, etc.), clear auth state
      // Only clear if it's an authentication error (401)
      if (error.response?.status === 401) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitializing: false });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } else {
        // For other errors (network, etc.), keep the token but mark as not initialized
        // This allows retry on next page load
        set({ isLoading: false, isInitializing: false });
      }
    } finally {
      set({ isInitializing: false });
    }
  },
  };
});

