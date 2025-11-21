import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Building2, Users, Package, Ticket, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  total_companies: number;
  total_active_users: number;
  total_assets: number;
  total_tickets: number;
  plan_distribution: {
    FREE: number;
    PRO: number;
    ENTERPRISE: number;
  };
}

export default function AnalyticsReports() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    company_id: null as number | null,
    plan_type: null as string | null,
  });

  useEffect(() => {
    loadCompanies();
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadCompanies = async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data.data || []);
    } catch (error) {
      // Silently fail
    }
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.company_id) params.company_id = filters.company_id;
      if (filters.plan_type) params.plan_type = filters.plan_type;

      const data = await api.getAdminAnalytics(params);
      setAnalytics(data as any);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || null }));
  };

  const clearFilters = () => {
    setFilters({ company_id: null, plan_type: null });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-text-secondary">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <select
                  value={filters.company_id || ''}
                  onChange={(e) => handleFilterChange('company_id', e.target.value ? parseInt(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background dark:bg-surface text-text-primary px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
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
                <Label>Plan Type</Label>
                <select
                  value={filters.plan_type || ''}
                  onChange={(e) => handleFilterChange('plan_type', e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-border bg-background dark:bg-surface text-text-primary px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                >
                  <option value="">All Plans</option>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{analytics.total_companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{analytics.total_active_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{analytics.total_assets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">{analytics.total_tickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-text-primary">{analytics.plan_distribution.FREE}</div>
              <div className="text-sm text-text-secondary">FREE</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-accent-primary">{analytics.plan_distribution.PRO}</div>
              <div className="text-sm text-text-secondary">PRO</div>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <div className="text-2xl font-bold text-accent-secondary">{analytics.plan_distribution.ENTERPRISE}</div>
              <div className="text-sm text-text-secondary">ENTERPRISE</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-text-secondary py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <p>Detailed charts and graphs coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

