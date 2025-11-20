import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Building2, Users, Package, Ticket, TrendingUp, AlertTriangle, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company, CompanyUsageStats } from '@/types';

export default function CompanySettings() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [usage, setUsage] = useState<CompanyUsageStats | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    timezone: 'UTC',
  });

  const canEdit = user?.is_owner || user?.roles?.some((r) => r.name === 'admin');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [companyData, usageData, planData] = await Promise.all([
        api.getCompany(),
        api.getCompanyUsage(),
        api.getCompanyPlan(),
      ]);

      setCompany(companyData.company);
      setOwner(companyData.owner);
      setStatistics(companyData.statistics);
      setUsage(usageData.usage);
      setPlan(planData.plan);

      setFormData({
        name: companyData.company.name,
        country: companyData.company.country || '',
        timezone: companyData.company.timezone || 'UTC',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updateCompany(formData);
      await loadData();
      setIsEditing(false);
      toast.success('Company settings updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update company settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'PRO':
        return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-orange-600';
    return 'bg-blue-600';
  };

  if (isLoading && !company) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Company not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your company information and settings</p>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>View and update your company details</CardDescription>
            </div>
            {canEdit && !isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Lisbon">Europe/Lisbon</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: company.name,
                      country: company.country || '',
                      timezone: company.timezone || 'UTC',
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Company Name</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{company.country || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Timezone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{company.timezone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Plan Type</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${getPlanBadgeColor(company.plan_type)}`}>
                      {company.plan_type}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Company Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(company.created_at).toLocaleDateString()}
                  </dd>
                </div>
                {owner && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">{owner.name} ({owner.email})</dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>Company Statistics</CardTitle>
            <CardDescription>Overview of your company resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{statistics.total_users}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Package className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{statistics.total_products}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{statistics.total_employees}</div>
                <div className="text-sm text-gray-600">Employees</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Ticket className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{statistics.total_tickets}</div>
                <div className="text-sm text-gray-600">Tickets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan & Usage */}
      {usage && plan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan & Usage</CardTitle>
            <CardDescription>Monitor your plan limits and resource consumption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Information */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-900">Current Plan</h3>
                <span className={`px-3 py-1 text-sm rounded ${getPlanBadgeColor(plan.plan_type)}`}>
                  {plan.plan_type}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Plan Limits:</p>
                <ul className="text-sm text-gray-900 space-y-1">
                  <li>• {plan.limits.max_users} users</li>
                  <li>• {plan.limits.max_products} products</li>
                  <li>• {plan.limits.max_tickets} tickets per month</li>
                </ul>
              </div>
            </div>

            {/* Usage Statistics */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="space-y-4">
                {/* Users Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Users</span>
                    <span className="text-sm text-gray-600">
                      {usage.users.current} / {usage.users.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.users.percentage)}`}
                      style={{ width: `${Math.min(usage.users.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.users.percentage >= 80 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {usage.users.percentage >= 100
                        ? 'Limit exceeded'
                        : 'Approaching limit'}
                    </p>
                  )}
                </div>

                {/* Products Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Products</span>
                    <span className="text-sm text-gray-600">
                      {usage.products.current} / {usage.products.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.products.percentage)}`}
                      style={{ width: `${Math.min(usage.products.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.products.percentage >= 80 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {usage.products.percentage >= 100
                        ? 'Limit exceeded'
                        : 'Approaching limit'}
                    </p>
                  )}
                </div>

                {/* Tickets Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tickets (This Month)</span>
                    <span className="text-sm text-gray-600">
                      {usage.tickets_this_month.current} / {usage.tickets_this_month.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.tickets_this_month.percentage)}`}
                      style={{ width: `${Math.min(usage.tickets_this_month.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.tickets_this_month.percentage >= 80 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {usage.tickets_this_month.percentage >= 100
                        ? 'Limit exceeded'
                        : 'Approaching limit'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            {plan.plan_type === 'FREE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Upgrade to Pro</h4>
                    <p className="text-sm text-blue-700">
                      Get more resources and features with a Pro plan
                    </p>
                  </div>
                  <Button disabled variant="default" className="opacity-50 cursor-not-allowed">
                    Coming Soon
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
