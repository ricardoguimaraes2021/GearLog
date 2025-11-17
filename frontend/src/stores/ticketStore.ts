import { create } from 'zustand';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface Ticket {
  id: number;
  title: string;
  product_id?: number;
  product?: {
    id: number;
    name: string;
  };
  opened_by: number;
  openedBy?: {
    id: number;
    name: string;
    email: string;
  };
  assigned_to?: number;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'damage' | 'maintenance' | 'update' | 'audit' | 'other';
  status: 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed';
  description: string;
  resolution?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  comments?: TicketComment[];
  logs?: TicketLog[];
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  message: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface TicketLog {
  id: number;
  ticket_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  action: 'created' | 'status_changed' | 'comment_added' | 'assigned' | 'unassigned' | 'closed' | 'resolved';
  old_value?: any;
  new_value?: any;
  created_at: string;
}

interface TicketFilters {
  status?: string;
  priority?: string;
  type?: string;
  assigned_to?: number;
  product_id?: number;
  search?: string;
}

interface TicketStore {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: TicketFilters;
  isLoading: boolean;
  fetchTickets: (page?: number) => Promise<void>;
  fetchTicket: (id: number) => Promise<void>;
  createTicket: (data: Partial<Ticket>) => Promise<Ticket | null>;
  updateTicket: (id: number, data: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  assignTicket: (id: number, assignedTo: number | null) => Promise<void>;
  updateStatus: (id: number, status: string, resolution?: string) => Promise<void>;
  resolveTicket: (id: number, resolution: string) => Promise<void>;
  closeTicket: (id: number, resolution?: string) => Promise<void>;
  addComment: (ticketId: number, message: string, attachments?: string[]) => Promise<void>;
  setFilters: (filters: Partial<TicketFilters>) => void;
  resetFilters: () => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  currentTicket: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },
  filters: {},
  isLoading: false,

  fetchTickets: async (page = 1) => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params = new URLSearchParams({
        page: page.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        ),
      });

      const response = await api.getTickets(Object.fromEntries(params));
      set({
        tickets: response.data || [],
        pagination: {
          current_page: response.current_page ?? 1,
          last_page: response.last_page ?? 1,
          per_page: response.per_page ?? 15,
          total: response.total ?? 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch tickets');
      set({ isLoading: false });
    }
  },

  fetchTicket: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await api.getTicket(id);
      set({ currentTicket: response, isLoading: false });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch ticket');
      set({ isLoading: false });
    }
  },

  createTicket: async (data: Partial<Ticket>) => {
    try {
      const response = await api.createTicket(data);
      toast.success('Ticket created successfully');
      return response;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create ticket');
      return null;
    }
  },

  updateTicket: async (id: number, data: Partial<Ticket>) => {
    try {
      await api.updateTicket(id, data);
      toast.success('Ticket updated successfully');
      await get().fetchTicket(id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update ticket');
    }
  },

  deleteTicket: async (id: number) => {
    try {
      await api.deleteTicket(id);
      toast.success('Ticket deleted successfully');
      await get().fetchTickets(get().pagination.current_page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete ticket');
    }
  },

  assignTicket: async (id: number, assignedTo: number | null) => {
    try {
      await api.assignTicket(id, assignedTo);
      toast.success('Ticket assigned successfully');
      await get().fetchTicket(id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign ticket');
    }
  },

  updateStatus: async (id: number, status: string, resolution?: string) => {
    try {
      await api.updateTicketStatus(id, status, resolution);
      toast.success('Ticket status updated');
      await get().fetchTicket(id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  },

  resolveTicket: async (id: number, resolution: string) => {
    try {
      await api.resolveTicket(id, resolution);
      toast.success('Ticket resolved');
      await get().fetchTicket(id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resolve ticket');
    }
  },

  closeTicket: async (id: number, resolution?: string) => {
    try {
      await api.closeTicket(id, resolution);
      toast.success('Ticket closed');
      await get().fetchTicket(id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to close ticket');
    }
  },

  addComment: async (ticketId: number, message: string, attachments?: string[]) => {
    try {
      await api.addTicketComment(ticketId, message, attachments);
      toast.success('Comment added');
      await get().fetchTicket(ticketId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    }
  },

  setFilters: (filters: Partial<TicketFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: {} });
  },
}));

