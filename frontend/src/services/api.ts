import axios, { AxiosError, AxiosInstance } from 'axios';
import type { User, Product, Category, Movement, DashboardData, PaginatedResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
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

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post<{ user: User; token: string }>('/login', {
      email,
      password,
    });
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

  async createProduct(data: FormData) {
    const response = await this.client.post<Product>('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateProduct(id: number, data: FormData) {
    data.append('_method', 'PUT');
    const response = await this.client.post<Product>(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
}

export const api = new ApiClient();

