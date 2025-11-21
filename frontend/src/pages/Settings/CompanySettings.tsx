import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Building2, Users, Package, Ticket, TrendingUp, AlertTriangle, Edit2, Save, X, Shield, UserCog, Plus, UserPlus, Copy, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [] as string[],
  });
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
      const [companyData, usageData, planData, usersData, invitesData] = await Promise.all([
        api.getCompany(),
        api.getCompanyUsage(),
        api.getCompanyPlan(),
        canManageRoles ? api.getUsers() : Promise.resolve([]),
        canManageRoles ? api.getCompanyInvites().catch(() => []) : Promise.resolve([]),
      ]);

      setCompany(companyData.company);
      setOwner(companyData.owner);
      setStatistics(companyData.statistics);
      setUsage(usageData.usage);
      setPlan(planData.plan);
      if (canManageRoles) {
        setCompanyUsers(usersData);
        setInvites(invitesData);
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

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const result = await api.createCompanyInvite();
      await loadData(); // Reload to get the new invite
      toast.success('Invite created successfully!', {
        description: `Invite code: ${result.code}`,
        duration: 6000,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invite');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this invite?')) {
      return;
    }
    try {
      await api.deleteCompanyInvite(id);
      await loadData(); // Reload to refresh the list
      toast.success('Invite deactivated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to deactivate invite');
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied to clipboard!');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Name, email and password are required');
      return;
    }

    if (newUserData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newUserData.password !== newUserData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    if (newUserData.roles.length === 0) {
      toast.error('At least one role must be selected');
      return;
    }

    setIsLoading(true);
    try {
      await api.createUser({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
        roles: newUserData.roles,
      });
      toast.success('User created successfully');
      setShowAddUserForm(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'gestor', label: 'Manager' },
    { value: 'tecnico', label: 'Technician' },
    { value: 'viewer', label: 'Viewer' },
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
        return 'bg-surface-alt text-text-primary dark:bg-surface-alt dark:text-text-primary';
      case 'PRO':
        return 'bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20 dark:text-accent-primary';
      case 'ENTERPRISE':
        return 'bg-accent-secondary/20 text-accent-secondary dark:bg-accent-secondary/30 dark:text-accent-secondary';
      default:
        return 'bg-surface-alt text-text-primary dark:bg-surface-alt dark:text-text-primary';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-danger dark:bg-danger';
    if (percentage >= 80) return 'bg-warning dark:bg-warning';
    return 'bg-accent-primary dark:bg-accent-primary';
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
          <h1 className="text-3xl font-bold text-text-primary">Company Settings</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-text-secondary">Company not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Company Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your company information and settings</p>
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
                    className="flex h-10 w-full rounded-md border border-border bg-background dark:bg-surface px-3 py-2 text-sm text-text-primary ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:ring-offset-2 focus-visible:border-accent-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                  <dt className="text-sm font-medium text-text-secondary">Company Name</dt>
                  <dd className="mt-1 text-sm font-semibold text-text-primary">{company.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Country</dt>
                  <dd className="mt-1 text-sm text-text-primary">{company.country || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Timezone</dt>
                  <dd className="mt-1 text-sm text-text-primary">{company.timezone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Plan Type</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${getPlanBadgeColor(company.plan_type)}`}>
                      {company.plan_type}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-secondary">Company Created</dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {new Date(company.created_at).toLocaleDateString()}
                  </dd>
                </div>
                {owner && (
                  <div>
                    <dt className="text-sm font-medium text-text-secondary">Owner</dt>
                    <dd className="mt-1 text-sm text-text-primary">{owner.name} ({owner.email})</dd>
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
              <div className="text-center p-4 border border-border rounded-lg">
                <Users className="w-8 h-8 mx-auto text-accent-primary mb-2" />
                <div className="text-2xl font-bold text-text-primary">{statistics.total_users}</div>
                <div className="text-sm text-text-secondary">Users</div>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <Package className="w-8 h-8 mx-auto text-success mb-2" />
                <div className="text-2xl font-bold text-text-primary">{statistics.total_products}</div>
                <div className="text-sm text-text-secondary">Products</div>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <Users className="w-8 h-8 mx-auto text-accent-secondary mb-2" />
                <div className="text-2xl font-bold text-text-primary">{statistics.total_employees}</div>
                <div className="text-sm text-text-secondary">Employees</div>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <Ticket className="w-8 h-8 mx-auto text-warning mb-2" />
                <div className="text-2xl font-bold text-text-primary">{statistics.total_tickets}</div>
                <div className="text-sm text-text-secondary">Tickets</div>
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
                <h3 className="text-md font-semibold text-text-primary">Current Plan</h3>
                <span className={`px-3 py-1 text-sm rounded ${getPlanBadgeColor(plan.plan_type)}`}>
                  {plan.plan_type}
                </span>
              </div>
              <div className="bg-surface-alt rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-2">Plan Limits:</p>
                <ul className="text-sm text-text-primary space-y-1">
                  <li>• {plan.limits.max_users} users</li>
                  <li>• {plan.limits.max_products} products</li>
                  <li>• {plan.limits.max_tickets} tickets per month</li>
                </ul>
              </div>
            </div>

            {/* Usage Statistics */}
            <div>
              <h3 className="text-md font-semibold text-text-primary mb-4">Usage Statistics</h3>
              <div className="space-y-4">
                {/* Users Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-secondary">Users</span>
                    <span className="text-sm text-text-secondary">
                      {usage.users.current} / {usage.users.max}
                    </span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2 dark:bg-surface-alt">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.users.percentage)}`}
                      style={{ width: `${Math.min(usage.users.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.users.percentage >= 80 && (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
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
                    <span className="text-sm font-medium text-text-secondary">Products</span>
                    <span className="text-sm text-text-secondary">
                      {usage.products.current} / {usage.products.max}
                    </span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2 dark:bg-surface-alt">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.products.percentage)}`}
                      style={{ width: `${Math.min(usage.products.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.products.percentage >= 80 && (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
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
                    <span className="text-sm font-medium text-text-secondary">Tickets (This Month)</span>
                    <span className="text-sm text-text-secondary">
                      {usage.tickets_this_month.current} / {usage.tickets_this_month.max}
                    </span>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-2 dark:bg-surface-alt">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(usage.tickets_this_month.percentage)}`}
                      style={{ width: `${Math.min(usage.tickets_this_month.percentage, 100)}%` }}
                    ></div>
                  </div>
                  {usage.tickets_this_month.percentage >= 80 && (
                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
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
              <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-4 dark:bg-accent-primary/20 dark:border-accent-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-accent-primary mb-1">Upgrade to Pro</h4>
                    <p className="text-sm text-text-secondary">
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

      {/* Company Invites */}
      {canManageRoles && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Company Invites
                </CardTitle>
                <CardDescription>
                  Generate invite codes for users to join your company. Codes are unique, permanent, and reusable.
                </CardDescription>
              </div>
              <Button onClick={handleCreateInvite} disabled={isCreatingInvite || isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingInvite ? 'Creating...' : 'Generate Invite'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingInvites ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-50" />
                <p className="text-sm text-text-secondary mb-4">No invite codes yet</p>
                <Button onClick={handleCreateInvite} disabled={isCreatingInvite || isLoading} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Your First Invite
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className={`border rounded-lg p-4 ${
                      invite.is_active
                        ? 'border-border bg-surface-alt dark:bg-surface-alt/50'
                        : 'border-border/50 bg-surface-alt/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-mono text-lg font-semibold text-text-primary tracking-wider">
                            {invite.code}
                          </div>
                          {invite.is_active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              Deactivated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                          <span>
                            Created: {new Date(invite.created_at).toLocaleDateString()}
                            {invite.creator && ` by ${invite.creator.name}`}
                          </span>
                          {invite.used_count > 0 && (
                            <span>
                              Used {invite.used_count} time{invite.used_count !== 1 ? 's' : ''}
                              {invite.last_used_at && ` (Last: ${new Date(invite.last_used_at).toLocaleDateString()})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {invite.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInviteCode(invite.code)}
                            title="Copy invite code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        {invite.is_active && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteInvite(invite.id)}
                            title="Deactivate invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {invites.length > 0 && (
              <div className="mt-4 p-3 bg-accent-primary/5 border border-accent-primary/10 rounded-lg">
                <p className="text-xs text-text-secondary">
                  <strong className="text-text-primary">Note:</strong> Users joining via invite code will automatically receive the "Viewer" (Read-only) role. You can update their roles later through User Roles Management.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Roles Management */}
      {canManageRoles && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Roles Management
                </CardTitle>
                <CardDescription>
                  Manage roles for users in your company. Only owner and admin can assign roles.
                </CardDescription>
              </div>
              {!showAddUserForm && (
                <Button onClick={() => setShowAddUserForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAddUserForm && (
              <div className="mb-6 border border-border rounded-lg p-4 bg-surface-alt">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Add New User</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddUserForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new_user_name" className="block text-sm font-medium text-text-primary">
                        Full Name *
                      </Label>
                      <Input
                        id="new_user_name"
                        type="text"
                        value={newUserData.name}
                        onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new_user_email" className="block text-sm font-medium text-text-primary">
                        Email *
                      </Label>
                      <Input
                        id="new_user_email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <PasswordInput
                      id="new_user_password"
                      label="Password *"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      showRequirements={true}
                      required
                    />
                    <PasswordInput
                      id="new_user_password_confirmation"
                      label="Confirm Password *"
                      value={newUserData.password_confirmation}
                      onChange={(e) => setNewUserData({ ...newUserData, password_confirmation: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-text-primary mb-2">Roles *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {availableRoles.map((role) => (
                        <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newUserData.roles.includes(role.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewUserData({
                                  ...newUserData,
                                  roles: [...newUserData.roles, role.value],
                                });
                              } else {
                                setNewUserData({
                                  ...newUserData,
                                  roles: newUserData.roles.filter((r) => r !== role.value),
                                });
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-text-primary">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddUserForm(false);
                        setNewUserData({
                          name: '',
                          email: '',
                          password: '',
                          password_confirmation: '',
                          roles: [],
                        });
                      }}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : companyUsers.length === 0 && !showAddUserForm ? (
              <p className="text-sm text-text-secondary text-center py-4">No users found</p>
            ) : (
              <div className="space-y-4">
                {companyUsers.map((companyUser) => {
                  const currentRoles = companyUser.roles?.map((r) => r.name) || [];
                  const isEditing = editingUserId === companyUser.id;
                  
                  return (
                    <div
                      key={companyUser.id}
                      className="border border-border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-text-muted" />
                            <span className="font-medium text-text-primary">{companyUser.name}</span>
                            {companyUser.is_owner && (
                              <span className="px-2 py-0.5 text-xs rounded bg-accent-secondary/10 text-accent-secondary dark:bg-accent-secondary/20 dark:text-accent-secondary">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mt-1">{companyUser.email}</p>
                          {!isEditing && currentRoles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {currentRoles.map((role) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 text-xs rounded bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20 dark:text-accent-primary"
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
              className="rounded border-border"
            />
            <span className="text-sm text-text-primary">{role.label}</span>
            {user.is_owner && role.value === 'admin' && (
              <span className="text-xs text-text-muted">(Required for owner)</span>
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
