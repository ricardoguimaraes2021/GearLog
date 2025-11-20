import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'statistics' | 'logs'>('overview');

  useEffect(() => {
    fetchCompany(companyId);
    fetchCompanyLogs(companyId);
  }, [companyId, fetchCompany, fetchCompanyLogs]);

  const handleSuspend = async () => {
    if (confirm('Are you sure you want to suspend this company?')) {
      await suspendCompany(companyId);
    }
  };

  const handleActivate = async () => {
    if (confirm('Are you sure you want to activate this company?')) {
      await activateCompany(companyId);
    }
  };

  const handleUpdatePlan = async () => {
    await updateCompanyPlan(companyId, planData);
    setShowPlanModal(false);
  };

  const handleImpersonate = async () => {
    if (!currentCompany?.owner) {
      alert('No owner found for this company');
      return;
    }

    if (confirm(`Impersonate user: ${currentCompany.owner.email}?`)) {
      try {
        const response = await api.impersonateUser(currentCompany.owner.id);
        // Store the impersonation token
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('impersonating', 'true');
        localStorage.setItem('original_user_id', response.original_user_id.toString());
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to impersonate user');
      }
    }
  };

  if (isLoading && !currentCompany) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">Loading company details...</div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">Company not found</div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentCompany.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Created: {new Date(currentCompany.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {currentCompany.suspended_at ? (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Activate
            </button>
          ) : (
            <button
              onClick={handleSuspend}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Suspend
            </button>
          )}
          <button
            onClick={() => {
              setPlanData({
                plan_type: currentCompany.plan_type,
                max_users: currentCompany.max_users,
                max_products: currentCompany.max_products,
                max_tickets: currentCompany.max_tickets,
              });
              setShowPlanModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Plan
          </button>
          {currentCompany.owner && (
            <button
              onClick={handleImpersonate}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Impersonate Owner
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
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
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Company Information</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Country</dt>
                  <dd className="text-sm font-medium text-gray-900">{currentCompany.country || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Timezone</dt>
                  <dd className="text-sm font-medium text-gray-900">{currentCompany.timezone}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Plan Type</dt>
                  <dd className="text-sm font-medium text-gray-900">{currentCompany.plan_type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentCompany.suspended_at ? 'Suspended' : currentCompany.is_active ? 'Active' : 'Inactive'}
                  </dd>
                </div>
              </dl>
            </div>

            {currentCompany.owner && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
                <p className="text-sm text-gray-900">{currentCompany.owner.name}</p>
                <p className="text-sm text-gray-600">{currentCompany.owner.email}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && companyStats && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
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
                </div>

                <div className="border rounded-lg p-4">
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
                </div>

                <div className="border rounded-lg p-4">
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
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Additional Statistics</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Total Product Value</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    €{companyStats.total_product_value.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Active Users</dt>
                  <dd className="text-lg font-semibold text-gray-900">{companyStats.active_users}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total Employees</dt>
                  <dd className="text-lg font-semibold text-gray-900">{companyStats.total_employees}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total Departments</dt>
                  <dd className="text-lg font-semibold text-gray-900">{companyStats.total_departments}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Recent Tickets (30 days)</dt>
                  <dd className="text-lg font-semibold text-gray-900">{companyStats.recent_tickets_30_days}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'logs' && companyLogs && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Tickets</h3>
              <div className="space-y-2">
                {companyLogs.recent_activity.tickets.slice(0, 10).map((ticket) => (
                  <div key={ticket.id} className="border rounded p-3">
                    <div className="font-medium text-gray-900">{ticket.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Status: {ticket.status} • {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Products</h3>
              <div className="space-y-2">
                {companyLogs.recent_activity.products.slice(0, 10).map((product) => (
                  <div key={product.id} className="border rounded p-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Status: {product.status} • {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Users</h3>
              <div className="space-y-2">
                {companyLogs.recent_activity.users.slice(0, 10).map((user) => (
                  <div key={user.id} className="border rounded p-3">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {user.email} • {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Update Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                <select
                  value={planData.plan_type}
                  onChange={(e) => setPlanData({ ...planData, plan_type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                <input
                  type="number"
                  value={planData.max_users}
                  onChange={(e) => setPlanData({ ...planData, max_users: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Products</label>
                <input
                  type="number"
                  value={planData.max_products}
                  onChange={(e) => setPlanData({ ...planData, max_products: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Tickets</label>
                <input
                  type="number"
                  value={planData.max_tickets}
                  onChange={(e) => setPlanData({ ...planData, max_tickets: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdatePlan}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

