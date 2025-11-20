import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Ban, CheckCircle, Settings, UserCog, Users, Package, Ticket, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyDetailsProps {
  companyId: number;
  onClose: () => void;
}

export default function CompanyDetails({ companyId, onClose }: CompanyDetailsProps) {
  const {
    currentCompany,
    companyStats,
    companyLogs,
    isLoading,
    fetchCompany,
    fetchCompanyLogs,
    suspendCompany,
    activateCompany,
    updateCompanyPlan,
  } = useAdminStore();

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planData, setPlanData] = useState({
    plan_type: 'FREE' as 'FREE' | 'PRO' | 'ENTERPRISE',
    max_users: 3,
    max_products: 500,
    max_tickets: 150,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics' | 'logs' | 'roles'>('overview');

  useEffect(() => {
    if (companyId) {
      fetchCompany(companyId);
      fetchCompanyLogs(companyId);
    }
  }, [companyId, fetchCompany, fetchCompanyLogs]);

  const handleSuspend = async () => {
    if (window.confirm('Are you sure you want to suspend this company?')) {
      try {
        await suspendCompany(companyId);
        toast.success('Company suspended successfully');
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleActivate = async () => {
    if (window.confirm('Are you sure you want to activate this company?')) {
      try {
        await activateCompany(companyId);
        toast.success('Company activated successfully');
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleUpdatePlan = async () => {
    try {
      await updateCompanyPlan(companyId, planData);
      setShowPlanModal(false);
      toast.success('Plan updated successfully');
    } catch (error) {
      // Error handled in store
    }
  };

  const handleImpersonate = async () => {
    if (!currentCompany?.owner) {
      toast.error('No owner found for this company');
      return;
    }

    if (window.confirm(`Impersonate user: ${currentCompany.owner.email}?`)) {
      try {
        const response = await api.impersonateUser(currentCompany.owner.id);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('impersonating', 'true');
        localStorage.setItem('original_user_id', response.original_user_id.toString());
        toast.success('Impersonation started');
        navigate('/admin');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to impersonate user');
      }
    }
  };

  if (isLoading && !currentCompany) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-8">
            <p>Company not found</p>
            <Button variant="outline" onClick={onClose} className="mt-4">
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{currentCompany.name}</CardTitle>
            <CardDescription>
              Created: {new Date(currentCompany.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {currentCompany.suspended_at ? (
            <Button variant="outline" onClick={handleActivate}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Activate
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleSuspend}>
              <Ban className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setPlanData({
                plan_type: currentCompany.plan_type,
                max_users: currentCompany.max_users,
                max_products: currentCompany.max_products,
                max_tickets: currentCompany.max_tickets,
              });
              setShowPlanModal(true);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Update Plan
          </Button>
          {currentCompany.owner && (
            <Button variant="outline" onClick={handleImpersonate}>
              <UserCog className="w-4 h-4 mr-2" />
              Impersonate Owner
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'statistics'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'logs'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'roles'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Roles
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Country</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-1">{currentCompany.country || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Timezone</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-1">{currentCompany.timezone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Plan Type</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-1">{currentCompany.plan_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Status</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-1">
                    {currentCompany.suspended_at ? 'Suspended' : currentCompany.is_active ? 'Active' : 'Inactive'}
                  </dd>
                </div>
              </dl>
            </div>

            {currentCompany.owner && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner</h3>
                <p className="text-sm text-gray-900">{currentCompany.owner.name}</p>
                <p className="text-sm text-gray-600">{currentCompany.owner.email}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && companyStats && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Users</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {companyStats.usage.users.current} / {companyStats.usage.users.max}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(companyStats.usage.users.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{companyStats.usage.users.percentage}%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Products</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {companyStats.usage.products.current} / {companyStats.usage.products.max}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(companyStats.usage.products.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{companyStats.usage.products.percentage}%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600">Tickets (This Month)</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {companyStats.usage.tickets_this_month.current} / {companyStats.usage.tickets_this_month.max}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min(companyStats.usage.tickets_this_month.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{companyStats.usage.tickets_this_month.percentage}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Additional Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Total Product Value</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">
                      €{companyStats.total_product_value.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Active Users</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">{companyStats.active_users}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Total Employees</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">{companyStats.total_employees}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Total Departments</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">{companyStats.total_departments}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Recent Tickets (30 days)</dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">{companyStats.recent_tickets_30_days}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'logs' && companyLogs && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyLogs.recent_activity.tickets.slice(0, 10).map((ticket) => (
                    <div key={ticket.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-gray-900">{ticket.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Status: {ticket.status} • {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyLogs.recent_activity.products.slice(0, 10).map((product) => (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Status: {product.status} • {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companyLogs.recent_activity.users.slice(0, 10).map((user) => (
                    <div key={user.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {user.email} • {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'roles' && currentCompany && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company User Roles</h3>
              <p className="text-sm text-gray-600 mb-4">
                Overview of roles assigned to users in this company
              </p>
            </div>
            {((currentCompany as any).users_with_roles && (currentCompany as any).users_with_roles.length > 0) ? (
              <div className="space-y-4">
                {(currentCompany as any).users_with_roles.map((companyUser: any) => (
                  <Card key={companyUser.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCog className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-900">{companyUser.name}</span>
                            {companyUser.is_owner && (
                              <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{companyUser.email}</p>
                          {companyUser.roles && companyUser.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {companyUser.roles.map((role: string) => (
                                <span
                                  key={role}
                                  className={`px-3 py-1 text-xs font-medium rounded ${
                                    role === 'admin'
                                      ? 'bg-red-100 text-red-800'
                                      : role === 'gestor'
                                      ? 'bg-blue-100 text-blue-800'
                                      : role === 'tecnico'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">No roles assigned</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(companyUser.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-4">No users found for this company</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>

      {/* Plan Update Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Update Plan</CardTitle>
              <CardDescription>Modify company plan and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePlan(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-type">Plan Type</Label>
                  <select
                    id="plan-type"
                    value={planData.plan_type}
                    onChange={(e) => setPlanData({ ...planData, plan_type: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-users">Max Users</Label>
                  <Input
                    id="max-users"
                    type="number"
                    value={planData.max_users}
                    onChange={(e) => setPlanData({ ...planData, max_users: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-products">Max Products</Label>
                  <Input
                    id="max-products"
                    type="number"
                    value={planData.max_products}
                    onChange={(e) => setPlanData({ ...planData, max_products: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-tickets">Max Tickets</Label>
                  <Input
                    id="max-tickets"
                    type="number"
                    value={planData.max_tickets}
                    onChange={(e) => setPlanData({ ...planData, max_tickets: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    Update
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
