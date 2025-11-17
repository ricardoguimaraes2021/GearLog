export interface User {
  id: number;
  name: string;
  email: string;
  roles?: Role[];
  permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category?: Category;
  brand?: string;
  model?: string;
  serial_number?: string;
  status: 'novo' | 'usado' | 'avariado' | 'reparação' | 'reservado';
  quantity: number;
  value?: number;
  purchase_date?: string;
  specs?: Record<string, any>;
  description?: string;
  image_url?: string;
  qr_code_url?: string;
  movements?: Movement[];
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: number;
  product_id: number;
  product?: Product;
  type: 'entrada' | 'saida' | 'alocacao' | 'devolucao';
  quantity: number;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  kpis: {
    total_products: number;
    total_value: number;
    damaged_products: number;
    low_stock_products: number;
  };
  products_by_category: Array<{
    name: string;
    count: number;
  }>;
  recent_movements: Movement[];
  alerts: {
    low_stock: number;
    low_stock_products?: Array<{
      id: number;
      name: string;
      category: string | null;
      quantity: number;
      status: string;
    }>;
    damaged: number;
    damaged_products?: Array<{
      id: number;
      name: string;
      category: string | null;
      quantity: number;
      status: string;
    }>;
    inactive: number;
    inactive_products?: Array<{
      id: number;
      name: string;
      category: string | null;
      quantity: number;
      status: string;
    }>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

