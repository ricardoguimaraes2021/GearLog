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
  status: 'new' | 'used' | 'damaged' | 'repair' | 'reserved';
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
  type: 'entry' | 'exit' | 'allocation' | 'return';
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
  tickets?: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    critical_tickets: number;
    unassigned_tickets: number;
  };
  products_by_category: Array<{
    name: string;
    count: number;
  }>;
  recent_movements: Array<Movement | {
    id: number;
    type: 'movement' | 'assignment_checkout' | 'assignment_return';
    product?: {
      id: number;
      name: string;
      category?: string | null;
    } | null;
    movement_type?: string;
    quantity?: number;
    assigned_to?: string;
    employee?: {
      id: number;
      name: string;
      employee_code: string;
    } | null;
    assigned_by?: string | null;
    returned_by?: string | null;
    assigned_at?: string;
    returned_at?: string | null;
    created_at: string;
    timestamp: string;
  }>;
  recent_tickets?: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    product: string | null;
    opened_by: string | null;
    assigned_to: string | null;
    created_at: string;
  }>;
  employees?: {
    total_employees: number;
    active_employees: number;
    total_assignments: number;
  };
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

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_employee_id?: number;
  manager?: Employee;
  cost_center?: string;
  employees?: Employee[];
  total_assigned_assets?: number;
  total_asset_value?: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  phone?: string;
  department_id?: number;
  department?: Department;
  position: string;
  status: 'active' | 'inactive';
  notes?: string;
  active_assignments?: AssetAssignment[];
  assignments?: AssetAssignment[];
  logs?: EmployeeLog[];
  created_at: string;
  updated_at: string;
}

export interface AssetAssignment {
  id: number;
  product_id: number;
  product?: Product;
  employee_id: number;
  employee?: Employee;
  assigned_by: number;
  assignedBy?: User;
  returned_by?: number;
  returnedBy?: User;
  assigned_at: string;
  returned_at?: string;
  condition_on_return?: string;
  notes?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLog {
  id: number;
  employee_id: number;
  employee?: Employee;
  user_id: number;
  user?: User;
  action: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

