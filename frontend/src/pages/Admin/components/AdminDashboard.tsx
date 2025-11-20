import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  Package, 
  Ticket, 
  TrendingUp,
  Activity,
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalStats {
  total_companies: number;
  total_active_users: number;
  total_assets: number;
  total_tickets: number;
  daily_active_users: number;
  monthly_active_users: number;
  system_health: {
    status: 'healthy' | 'warning' | 'critical';
    response_time: number;
    error_rate: number;
  };
}

interface DashboardFilters {
  company_id?: number | null;
  role?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  plan_type?: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    company_id: null,
    role: null,
    date_from: null,
    date_to: null,
    plan_type: null,
  });

  useEffect(() => {
    loadCompanies();
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data.data || []);
    } catch (error) {
      // Silently fail - companies filter is optional
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.company_id) params.company_id = filters.company_id;
      if (filters.role) params.role = filters.role;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.plan_type) params.plan_type = filters.plan_type;

      const data = await api.getAdminAnalytics(params);
      setStats(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || null }));
  };

  const clearFilters = () => {
    setFilters({
      company_id: null,
      role: null,
      date_from: null,
      date_to: null,
      plan_type: null,
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-text-secondary">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success bg-success/10 border border-success/20';
      case 'warning':
        return 'text-warning bg-warning/10 border border-warning/20';
      case 'critical':
        return 'text-danger bg-danger/10 border border-danger/20';
      default:
        return 'text-text-secondary bg-surface-alt border border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <select
                  value={filters.company_id || ''}
                  onChange={(e) => handleFilterChange('company_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="gestor">Manager</option>
                  <option value="tecnico">Technician</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Plan Type</Label>
                <select
                  value={filters.plan_type || ''}
                  onChange={(e) => handleFilterChange('plan_type', e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
                >
                  <option value="">All Plans</option>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || null)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_companies}</div>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_active_users}</div>
            <p className="text-xs text-muted-foreground">Across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_assets}</div>
            <p className="text-xs text-muted-foreground">Products tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tickets}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Daily Active Users (DAU)</span>
                <span className="text-lg font-semibold text-text-primary">{stats.daily_active_users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Monthly Active Users (MAU)</span>
                <span className="text-lg font-semibold text-text-primary">{stats.monthly_active_users}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Status</span>
                <span className={`px-2 py-1 text-xs rounded ${getHealthColor(stats.system_health.status)}`}>
                  {stats.system_health.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Response Time</span>
                <span className="text-lg font-semibold text-text-primary">{stats.system_health.response_time}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Error Rate</span>
                <span className="text-lg font-semibold text-text-primary">{stats.system_health.error_rate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
