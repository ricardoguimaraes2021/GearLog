import axios, { AxiosError, AxiosInstance } from 'axios';
import type { User, Product, Category, Movement, DashboardData, PaginatedResponse, Employee, Department, AssetAssignment, Company, CompanyUsageStats, CompanyStatistics, CompanyWithStats, CompanyLogs } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  public client: AxiosInstance;
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
      timeout: 30000, // 30 seconds timeout
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
        // Add auth token only if it exists
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Remove Authorization header if no token exists
          delete config.headers.Authorization;
        }

        // For FormData, let browser set Content-Type with boundary
        const isFormData = config.data instanceof FormData;
        if (isFormData) {
          delete config.headers['Content-Type'];
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
          // Only clear auth if we're not already on login page or logout endpoint
          const isLoginPage = window.location.pathname.includes('/login');
          const isLogoutEndpoint = error.config?.url?.includes('/logout');
          const token = localStorage.getItem('auth_token');
          
          if (token && !isLoginPage && !isLogoutEndpoint) {
            // Token is expired or invalid - clear it
            // The authStore will handle state updates on next API call
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Dispatch a custom event that authStore can listen to if needed
            window.dispatchEvent(new CustomEvent('auth:token-expired'));
          }
        }
        
        // Handle rate limiting errors (429)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          error.message = `Too many attempts. Please try again after ${retryAfter} seconds.`;
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
    const response = await axios.post<{ user: User; token: string; requires_onboarding?: boolean }>(
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

  async register(name: string, email: string, password: string) {
    await this.ensureCsrfToken();
    
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    const response = await axios.post<{ user: User; token: string; requires_onboarding: boolean }>(
      `${this.baseURL}/api/v1/register`,
      {
        name,
        email,
        password,
        password_confirmation: password,
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

  async onboarding(data: { company_name?: string; invite_code?: string; country?: string | null; timezone?: string }) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    await this.ensureCsrfToken();
    
    const csrfToken = this.getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    const response = await axios.post<{ user: User; company: any }>(
      `${this.baseURL}/api/v1/onboarding`,
      data,
      {
        withCredentials: true,
        headers,
      }
    );
    
    return response.data;
  }

  async logout() {
    const token = localStorage.getItem('auth_token');
    
    // Only try to call logout endpoint if we have a token
    if (token) {
      try {
        // Try to logout on server, but don't fail if it errors
        // (token might already be invalid, which is fine)
        await this.client.post('/logout');
      } catch (error: any) {
        // If logout fails with 401, that's fine - token was already invalid
        // For other errors, log but continue with cleanup
        if (error.response?.status !== 401) {
          console.warn('Logout API call failed, but continuing with cleanup:', error);
        }
      }
    }
    
    // Always clean up local storage and state, regardless of API call result
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Clear any CSRF tokens
    document.cookie.split(";").forEach((c) => {
      const cookieName = c.trim().split("=")[0];
      if (cookieName === 'XSRF-TOKEN' || cookieName.startsWith('XSRF-TOKEN')) {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
      }
    });
  }

  async getCurrentUser() {
    const response = await this.client.get<User>('/user');
    // Validate response in development
    if (import.meta.env.DEV) {
      const { validateApiResponse, UserSchema } = await import('@/utils/apiValidation');
      return validateApiResponse(response.data, UserSchema, 'getCurrentUser');
    }
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

    // Users
    async getUsers(params?: { role?: string; search?: string }) {
      const response = await this.client.get<User[]>('/users', { params });
      return response.data;
    }

    async createUser(data: { name: string; email: string; password: string; roles: string[] }) {
      const response = await this.client.post<{ message: string; user: User }>('/users', data);
      return response.data;
    }

    async updateUserRoles(userId: number, roles: string[]) {
      const response = await this.client.put<{ message: string; user: User }>(`/users/${userId}/roles`, { roles });
      return response.data;
    }

    // Company Invites
    async createCompanyInvite() {
      const response = await this.client.post<{ message: string; invite: any; code: string }>('/company/invites', {});
      return response.data;
    }

    async getCompanyInvites() {
      const response = await this.client.get<any[]>('/company/invites');
      return response.data;
    }

    async validateInviteCode(code: string) {
      try {
        const response = await axios.get<{ valid: boolean; company?: any; code?: string; error?: string }>(
          `${this.baseURL}/api/v1/invites/${code}/validate`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        return response.data;
      } catch (error: any) {
        // Handle 404 as invalid invite
        if (error.response?.status === 404 && error.response?.data) {
          return error.response.data;
        }
        throw error;
      }
    }

    async deleteCompanyInvite(id: number) {
      const response = await this.client.delete<{ message: string }>(`/company/invites/${id}`);
      return response.data;
    }

    // Tickets
    async getTickets(params?: Record<string, any>) {
      const response = await this.client.get('/tickets', { params });
      return response.data;
    }

    async getTicket(id: number) {
      const response = await this.client.get(`/tickets/${id}`);
      return response.data;
    }

    async createTicket(data: any) {
      const response = await this.client.post('/tickets', data);
      return response.data;
    }

    async updateTicket(id: number, data: any) {
      const response = await this.client.put(`/tickets/${id}`, data);
      return response.data;
    }

    async deleteTicket(id: number) {
      await this.client.delete(`/tickets/${id}`);
    }

    async assignTicket(id: number, assignedTo: number | null) {
      const response = await this.client.post(`/tickets/${id}/assign`, { assigned_to: assignedTo });
      return response.data;
    }

    async assignTicketToEmployee(id: number, employeeId: number | null) {
      const response = await this.client.post(`/tickets/${id}/assign`, { employee_id: employeeId });
      return response.data;
    }

    async updateTicketStatus(id: number, status: string, resolution?: string) {
      const response = await this.client.post(`/tickets/${id}/status`, { status, resolution });
      return response.data;
    }

    async resolveTicket(id: number, resolution: string) {
      const response = await this.client.post(`/tickets/${id}/resolve`, { resolution });
      return response.data;
    }

    async closeTicket(id: number, resolution?: string) {
      const response = await this.client.post(`/tickets/${id}/close`, { resolution });
      return response.data;
    }

    async getTicketComments(ticketId: number) {
      const response = await this.client.get(`/tickets/${ticketId}/comments`);
      return response.data;
    }

    async addTicketComment(ticketId: number, message: string, attachments?: string[]) {
      const response = await this.client.post(`/tickets/${ticketId}/comments`, { message, attachments });
      return response.data;
    }

    async getTicketDashboard() {
      const response = await this.client.get('/tickets/dashboard');
      return response.data;
    }

    // Employees
    async getEmployees(params?: Record<string, any>) {
      const response = await this.client.get<PaginatedResponse<Employee>>('/employees', { params });
      return response.data;
    }

    async getEmployee(id: number) {
      const response = await this.client.get<Employee>(`/employees/${id}`);
      return response.data;
    }

    async createEmployee(data: Partial<Employee>) {
      const response = await this.client.post<Employee>('/employees', data);
      return response.data;
    }

    async updateEmployee(id: number, data: Partial<Employee>) {
      const response = await this.client.put<Employee>(`/employees/${id}`, data);
      return response.data;
    }

    async deleteEmployee(id: number) {
      await this.client.delete(`/employees/${id}`);
    }

    async deactivateEmployee(id: number) {
      const response = await this.client.post<Employee>(`/employees/${id}/deactivate`);
      return response.data;
    }

    async reactivateEmployee(id: number) {
      const response = await this.client.post<Employee>(`/employees/${id}/reactivate`);
      return response.data;
    }

    async exportEmployees(format: 'csv' | 'excel' | 'pdf', params?: Record<string, any>) {
      const response = await this.client.get(`/employees/export/${format}`, {
        params,
        responseType: 'blob',
      });
      return response.data;
    }

    // Departments
    async getDepartments(params?: Record<string, any>) {
      const response = await this.client.get<Department[]>('/departments', { params });
      return response.data;
    }

    async getDepartment(id: number) {
      const response = await this.client.get<Department>(`/departments/${id}`);
      return response.data;
    }

    async createDepartment(data: Partial<Department>) {
      const response = await this.client.post<Department>('/departments', data);
      return response.data;
    }

    async updateDepartment(id: number, data: Partial<Department>) {
      const response = await this.client.put<Department>(`/departments/${id}`, data);
      return response.data;
    }

    async deleteDepartment(id: number) {
      await this.client.delete(`/departments/${id}`);
    }

    async getDepartmentUsageStats() {
      const response = await this.client.get('/departments/stats/usage');
      return response.data;
    }

    // Assignments
    async checkoutAsset(data: { product_id: number; employee_id: number; notes?: string }) {
      const response = await this.client.post<AssetAssignment>('/assignments/checkout', data);
      return response.data;
    }

    async checkinAsset(assignmentId: number, data: { condition_on_return?: string; product_status?: string; notes?: string }) {
      const response = await this.client.post<AssetAssignment>(`/assignments/${assignmentId}/checkin`, data);
      return response.data;
    }

    async getAssignmentHistoryByEmployee(employeeId: number) {
      const response = await this.client.get<PaginatedResponse<AssetAssignment>>(`/assignments/history/employee/${employeeId}`);
      return response.data;
    }

    async getAssignmentHistoryByAsset(productId: number) {
      const response = await this.client.get<PaginatedResponse<AssetAssignment>>(`/assignments/history/asset/${productId}`);
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

    // Admin endpoints (Super Admin only)
    async getCompanies(params?: {
      page?: number;
      per_page?: number;
      search?: string;
      plan_type?: 'FREE' | 'PRO' | 'ENTERPRISE';
      is_active?: boolean;
      suspended?: boolean;
    }): Promise<PaginatedResponse<CompanyWithStats>> {
      const response = await this.client.get<PaginatedResponse<CompanyWithStats>>('/admin/companies', { params });
      return response.data;
    }

    async getAdminCompany(id: number): Promise<{ company: CompanyWithStats; owner?: User | null; statistics: CompanyStatistics }> {
      const response = await this.client.get<{ company: CompanyWithStats; owner?: User | null; statistics: CompanyStatistics }>(`/admin/companies/${id}`);
      // Merge owner into company object if provided separately
      if (response.data.owner && !response.data.company.owner) {
        response.data.company.owner = response.data.owner;
      }
      return response.data;
    }

    async suspendCompany(id: number): Promise<{ message: string; company: Company }> {
      const response = await this.client.post<{ message: string; company: Company }>(`/admin/companies/${id}/suspend`);
      return response.data;
    }

    async activateCompany(id: number): Promise<{ message: string; company: Company }> {
      const response = await this.client.post<{ message: string; company: Company }>(`/admin/companies/${id}/activate`);
      return response.data;
    }

    async updateCompanyPlan(id: number, plan: {
      plan_type: 'FREE' | 'PRO' | 'ENTERPRISE';
      max_users?: number;
      max_products?: number;
      max_tickets?: number;
    }): Promise<{ message: string; company: Company }> {
      const response = await this.client.put<{ message: string; company: Company }>(`/admin/companies/${id}/plan`, plan);
      return response.data;
    }

    async getCompanyLogs(id: number): Promise<CompanyLogs> {
      const response = await this.client.get<CompanyLogs>(`/admin/companies/${id}/logs`);
      return response.data;
    }

    async impersonateUser(userId: number): Promise<{ user: User; token: string; original_user_id: number; message: string }> {
      const response = await this.client.post<{ user: User; token: string; original_user_id: number; message: string }>(`/admin/impersonate/${userId}`);
      return response.data;
    }

    async stopImpersonation(): Promise<{ message: string }> {
      const response = await this.client.post<{ message: string }>('/admin/stop-impersonation');
      return response.data;
    }

    // Profile endpoints
    async getProfile(): Promise<{ user: User }> {
      const response = await this.client.get<{ user: User }>('/profile');
      return response.data;
    }

    async updateProfile(data: { name: string }): Promise<{ message: string; user: User }> {
      const response = await this.client.put<{ message: string; user: User }>('/profile', data);
      return response.data;
    }

    async updatePassword(data: { current_password: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
      const response = await this.client.put<{ message: string }>('/profile/password', data);
      return response.data;
    }

    // Company Settings endpoints
    async getCompany(): Promise<{ company: Company; owner: User | null; statistics: any }> {
      const response = await this.client.get<{ company: Company; owner: User | null; statistics: any }>('/company');
      return response.data;
    }

    async updateCompany(data: { name: string; country?: string; timezone?: string }): Promise<{ message: string; company: Company }> {
      const response = await this.client.put<{ message: string; company: Company }>('/company', data);
      return response.data;
    }

    async getCompanyUsage(): Promise<{ usage: CompanyUsageStats }> {
      const response = await this.client.get<{ usage: CompanyUsageStats }>('/company/usage');
      return response.data;
    }

    async getCompanyPlan(): Promise<{ plan: any }> {
      const response = await this.client.get<{ plan: any }>('/company/plan');
      return response.data;
    }

    // Admin Analytics endpoints
    async getAdminAnalytics(params?: {
      company_id?: number;
      role?: string;
      date_from?: string;
      date_to?: string;
      plan_type?: string;
    }): Promise<any> {
      const response = await this.client.get('/admin/analytics/global', { params });
      return response.data;
    }

    async getAdminUsers(): Promise<User[]> {
      const response = await this.client.get('/admin/users');
      return response.data;
    }

    async getAdminSecurityLogs(): Promise<any[]> {
      const response = await this.client.get('/admin/logs/security');
      return response.data;
    }
  }

  export const api = new ApiClient();

