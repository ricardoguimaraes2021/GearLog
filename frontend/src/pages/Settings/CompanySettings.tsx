import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Building2, Users, Package, Ticket, TrendingUp, AlertTriangle, Edit2, Save, X, Shield, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company, CompanyUsageStats, User, Role } from '@/types';

export default function CompanySettings() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [owner, setOwner] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [usage, setUsage] = useState<CompanyUsageStats | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    timezone: 'UTC',
  });

  const canEdit = user?.is_owner || user?.roles?.some((r) => r.name === 'admin');
  const canManageRoles = user?.is_owner || user?.roles?.some((r) => r.name === 'admin');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [companyData, usageData, planData, usersData] = await Promise.all([
        api.getCompany(),
        api.getCompanyUsage(),
        api.getCompanyPlan(),
        canManageRoles ? api.getUsers() : Promise.resolve([]),
      ]);

      setCompany(companyData.company);
      setOwner(companyData.owner);
      setStatistics(companyData.statistics);
      setUsage(usageData.usage);
      setPlan(planData.plan);
      if (canManageRoles) {
        setCompanyUsers(usersData);
      }

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

  const handleUpdateUserRoles = async (userId: number, roles: string[]) => {
    try {
      await api.updateUserRoles(userId, roles);
      await loadData(); // Reload to get updated data
      setEditingUserId(null);
      toast.success('User roles updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user roles');
    }
  };

  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'gestor', label: 'Manager' },
    { value: 'tecnico', label: 'Technician' },
    { value: 'consulta', label: 'Consulta' },
  ];

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

      {/* User Roles Management */}
      {canManageRoles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Roles Management
            </CardTitle>
            <CardDescription>
              Manage roles for users in your company. Only owner and admin can assign roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : companyUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-4">
                {companyUsers.map((companyUser) => {
                  const currentRoles = companyUser.roles?.map((r) => r.name) || [];
                  const isEditing = editingUserId === companyUser.id;
                  
                  return (
                    <div
                      key={companyUser.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{companyUser.name}</span>
                            {companyUser.is_owner && (
                              <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{companyUser.email}</p>
                          {!isEditing && currentRoles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {currentRoles.map((role) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(companyUser.id)}
                            disabled={companyUser.is_owner}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            {companyUser.is_owner ? 'Owner (Fixed)' : 'Edit Roles'}
                          </Button>
                        )}
                      </div>
                      
                      {isEditing && (
                        <UserRoleEditor
                          user={companyUser}
                          currentRoles={currentRoles}
                          availableRoles={availableRoles}
                          onSave={(roles) => handleUpdateUserRoles(companyUser.id, roles)}
                          onCancel={() => setEditingUserId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface UserRoleEditorProps {
  user: User;
  currentRoles: string[];
  availableRoles: { value: string; label: string }[];
  onSave: (roles: string[]) => void;
  onCancel: () => void;
}

function UserRoleEditor({ user, currentRoles, availableRoles, onSave, onCancel }: UserRoleEditorProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = async () => {
    if (selectedRoles.length === 0) {
      toast.error('User must have at least one role');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(selectedRoles);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      <Label>Select Roles</Label>
      <div className="space-y-2">
        {availableRoles.map((role) => (
          <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role.value)}
              onChange={() => handleToggleRole(role.value)}
              disabled={user.is_owner && role.value === 'admin'} // Owner must always have admin
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{role.label}</span>
            {user.is_owner && role.value === 'admin' && (
              <span className="text-xs text-gray-500">(Required for owner)</span>
            )}
          </label>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving || selectedRoles.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Roles'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
