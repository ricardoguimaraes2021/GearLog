import { create } from 'zustand';
import { api } from '../services/api';
import { toast } from 'sonner';
import { initializeEcho, getEcho, disconnectEcho } from '../services/echo';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: {
    ticket_id?: number;
    ticket_title?: string;
    product_id?: number;
    product_name?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  echoInitialized: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  addNotification: (notification: Notification) => void;
  testNotification: () => Promise<any>;
  initializeEcho: (token: string) => void;
  disconnectEcho: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  echoInitialized: false,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.client.get('/notifications', {
        params: { page, per_page: 20 },
      });
      // Handle paginated response
      const notifications = response.data.data || response.data || [];
      set({
        notifications: Array.isArray(notifications) ? notifications : [],
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  testNotification: async () => {
    try {
      const response = await api.client.post('/notifications/test');
      toast.success('Test notification created!');
      // Refresh notifications and count
      await get().fetchNotifications(1);
      await get().fetchUnreadCount();
      return response.data;
    } catch (error: any) {
      toast.error('Failed to create test notification');
      console.error(error);
      return null;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.client.get('/notifications/unread-count');
      set({ unreadCount: response.data.count || 0 });
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.client.post(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      await api.client.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all as read');
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await api.client.delete(`/notifications/${id}`);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read_at
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error: any) {
      toast.error('Failed to delete notification');
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Show toast notification
    const getNotificationIcon = (type: string) => {
      if (type.includes('sla')) return '⚠️';
      if (type.includes('ticket')) return '🎫';
      if (type.includes('stock')) return '📦';
      if (type.includes('damaged')) return '🔴';
      return '🔔';
    };

    toast.info(notification.title, {
      description: notification.message,
      duration: 5000,
      action: notification.data?.ticket_id
        ? {
            label: 'View',
            onClick: () => {
              window.location.href = `/tickets/${notification.data?.ticket_id}`;
            },
          }
        : notification.data?.product_id
        ? {
            label: 'View',
            onClick: () => {
              window.location.href = `/products/${notification.data?.product_id}`;
            },
          }
        : undefined,
    });
  },

  initializeEcho: (token: string) => {
    if (get().echoInitialized) {
      return;
    }

    // Check if Pusher is configured
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    if (!pusherKey) {
      console.warn('Pusher not configured. Real-time notifications will not work.');
      return;
    }

    try {
      const echo = initializeEcho(token);
      
      // Get user ID from localStorage (stored during login)
      const authState = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const userId = authState?.id || null;

      if (userId) {
        // Listen to private user channel
        echo.private(`user.${userId}`)
          .notification((notification: Notification) => {
            get().addNotification(notification);
            get().fetchUnreadCount();
          });
      }

      set({ echoInitialized: true });
    } catch (error) {
      console.error('Failed to initialize Echo:', error);
      // Don't throw - allow app to work without real-time notifications
    }
  },

  disconnectEcho: () => {
    disconnectEcho();
    set({ echoInitialized: false });
  },
}));

