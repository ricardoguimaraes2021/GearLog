import axios, { AxiosError, AxiosInstance } from 'axios';
import type { User, Product, Category, Movement, DashboardData, PaginatedResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    // Helper to get CSRF token from cookie
    const getCsrfToken = () => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; XSRF-TOKEN=`);
      if (parts.length === 2) {
        const token = parts.pop()?.split(';').shift();
        return token ? decodeURIComponent(token) : null;
      }
      return null;
    };

    // Request interceptor to add auth token and CSRF token
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // For state-changing requests, ensure CSRF token is available
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
          // Get CSRF token from cookie
          let csrfToken = getCsrfToken();
          
          // If no CSRF token, fetch it first
          if (!csrfToken) {
            try {
              await axios.get(`${this.baseURL}/sanctum/csrf-cookie`, {
                withCredentials: true,
                headers: { 'Accept': 'application/json' },
              });
              csrfToken = getCsrfToken();
            } catch (error) {
              console.warn('Failed to fetch CSRF cookie:', error);
            }
          }

          // Add X-XSRF-TOKEN header if token exists
          if (csrfToken) {
            config.headers['X-XSRF-TOKEN'] = csrfToken;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle CSRF token mismatch - retry once after fetching new token
        if (error.response?.status === 419 || error.response?.status === 403) {
          const errorData = error.response.data as any;
          if (errorData?.message?.includes('CSRF') || errorData?.message?.includes('419')) {
            // Fetch new CSRF token and retry
            try {
              await this.ensureCsrfToken();
              // Retry the original request
              const config = error.config;
              if (config) {
                const csrfToken = this.getCsrfToken();
                if (csrfToken && config.headers) {
                  config.headers['X-XSRF-TOKEN'] = csrfToken;
                }
                return this.client.request(config);
              }
            } catch (retryError) {
              // If retry fails, continue with original error
            }
          }
        }

        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        
        // Extract user-friendly error message
        if (error.response?.data) {
          const data = error.response.data as any;
          if (data.error) {
            // Use the user-friendly error message from backend
            error.message = data.error;
          } else if (data.message) {
            error.message = data.message;
          } else if (typeof data === 'string') {
            error.message = data;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Helper methods for CSRF token management
  private getCsrfToken(): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; XSRF-TOKEN=`);
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift();
      return token ? decodeURIComponent(token) : null;
    }
    return null;
  }

  private async ensureCsrfToken(): Promise<void> {
    await axios.get(`${this.baseURL}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { 'Accept': 'application/json' },
    });
  }

  // Auth
  async login(email: string, password: string) {
    // First, get CSRF cookie from Sanctum
    await this.ensureCsrfToken();
    
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add X-XSRF-TOKEN header if CSRF token exists
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Then make the login request with the same base URL to ensure cookies are sent
    const response = await axios.post<{ user: User; token: string }>(
      `${this.baseURL}/api/v1/login`,
      {
        email,
        password,
      },
      {
        withCredentials: true,
        headers,
      }
    );
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/logout');
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser() {
    const response = await this.client.get<User>('/user');
    return response.data;
  }

  // Products
  async getProducts(params?: {
    search?: string;
    category_id?: number;
    status?: string;
    min_quantity?: number;
    max_quantity?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }) {
    const response = await this.client.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  }

    async getProduct(id: number) {
      const response = await this.client.get<Product>(`/products/${id}`);
      return response.data;
    }

    // Public product endpoint (no authentication required)
    async getProductPublic(id: number) {
      const response = await axios.get<Product>(`${this.baseURL}/api/v1/products/${id}/public`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    }

  async createProduct(data: FormData) {
    // CSRF token is automatically added by the interceptor
    const response = await this.client.post<Product>('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateProduct(id: number, data: FormData) {
    data.append('_method', 'PUT');
    
    // Ensure CSRF token is available
    const csrfToken = this.getCsrfToken();
    if (!csrfToken) {
      await this.ensureCsrfToken();
    }

    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
    const token = this.getCsrfToken();
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }

    const response = await this.client.post<Product>(`/products/${id}`, data, { headers });
    return response.data;
  }

  async deleteProduct(id: number) {
    await this.client.delete(`/products/${id}`);
  }

  async exportProducts(format: 'csv' | 'excel' | 'pdf', params?: Record<string, any>) {
    const response = await this.client.get(`/products/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // Categories
  async getCategories() {
    const response = await this.client.get<Category[]>('/categories');
    return response.data;
  }

  async createCategory(data: { name: string }) {
    const response = await this.client.post<Category>('/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: { name: string }) {
    const response = await this.client.put<Category>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number) {
    await this.client.delete(`/categories/${id}`);
  }

  // Movements
  async getProductMovements(productId: number) {
    const response = await this.client.get<PaginatedResponse<Movement>>(
      `/products/${productId}/movements`
    );
    return response.data;
  }

  async createMovement(productId: number, data: {
    type: Movement['type'];
    quantity: number;
    assigned_to?: string;
    notes?: string;
  }) {
    const response = await this.client.post<Movement>(`/products/${productId}/movements`, data);
    return response.data;
  }

    // Dashboard
    async getDashboard() {
      const response = await this.client.get<DashboardData>('/dashboard');
      return response.data;
    }

    // Helper method to get full URL for storage files
    getStorageUrl(path: string | null | undefined): string | null {
      if (!path) return null;
      
      // If it's already a full URL, return as is
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      
      // If it starts with /storage, just prepend the base URL
      if (path.startsWith('/storage')) {
        return `${this.baseURL}${path}`;
      }
      
      // Otherwise, assume it's a relative path and prepend /storage
      return `${this.baseURL}/storage/${path}`;
    }
  }

  export const api = new ApiClient();

