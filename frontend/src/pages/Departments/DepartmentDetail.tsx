import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Building2, Users, Package, Ticket, DollarSign, User, Mail, Phone, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentDepartment, fetchDepartment, isLoading } = useDepartmentStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'assets' | 'analytics'>('overview');
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDepartment(parseInt(id));
      fetchEmployees(1);
      fetchUsageStats();
    }
  }, [id, fetchDepartment, fetchEmployees]);

  const fetchUsageStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await api.getDepartmentUsageStats();
      setUsageStats(stats);
    } catch (error: any) {
      toast.error('Failed to load usage statistics');
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  const departmentEmployees = employees.filter(
    (emp) => emp.department_id === currentDepartment?.id
  );

  if (isLoading || !currentDepartment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/departments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center">
              <Building2 className="w-8 h-8 mr-3 text-accent-primary" />
              {currentDepartment.name}
            </h1>
            {currentDepartment.description && (
              <p className="mt-1 text-sm text-text-secondary">{currentDepartment.description}</p>
            )}
          </div>
        </div>
        <Link to={`/departments/${currentDepartment.id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Department
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Employees</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {currentDepartment.employees?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-accent-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Assigned Assets</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {currentDepartment.total_assigned_assets || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-success dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Value</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  €{((currentDepartment.total_asset_value || 0) / 1000).toFixed(1)}k
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-success dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Tickets</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {currentDepartment.active_tickets_count || 0}
                </p>
              </div>
              <Ticket className="w-8 h-8 text-warning dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            Employees ({departmentEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assets'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            Assets ({currentDepartment.total_assigned_assets || 0})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Name</label>
                  <p className="mt-1 text-sm text-text-primary">{currentDepartment.name}</p>
                </div>
                {currentDepartment.description && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Description</label>
                    <p className="mt-1 text-sm text-text-primary">{currentDepartment.description}</p>
                  </div>
                )}
                {currentDepartment.cost_center && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Cost Center</label>
                    <p className="mt-1 text-sm text-text-primary">{currentDepartment.cost_center}</p>
                  </div>
                )}
                {currentDepartment.manager && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Manager</label>
                    <div className="mt-1">
                      <Link
                        to={`/employees/${currentDepartment.manager.id}`}
                        className="text-sm text-accent-primary hover:text-accent-primary/80 hover:underline"
                      >
                        {currentDepartment.manager.name}
                      </Link>
                      {currentDepartment.manager.employee_code && (
                        <span className="text-sm text-text-secondary ml-2">
                          ({currentDepartment.manager.employee_code})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Total Employees</span>
                  <span className="text-sm font-medium text-text-primary">{currentDepartment.employees?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Assigned Assets</span>
                  <span className="text-sm font-medium text-text-primary">{currentDepartment.total_assigned_assets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Total Asset Value</span>
                  <span className="text-sm font-medium text-success dark:text-green-400">
                    €{(currentDepartment.total_asset_value || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Active Tickets</span>
                  <span className="text-sm font-medium text-text-primary">{currentDepartment.active_tickets_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'employees' && (
          <Card>
            <CardHeader>
              <CardTitle>Department Employees</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentEmployees.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">No employees in this department</p>
              ) : (
                <div className="space-y-4">
                  {departmentEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-alt dark:hover:bg-surface-alt"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/10 dark:bg-accent-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div>
                          <Link
                            to={`/employees/${employee.id}`}
                            className="font-medium text-text-primary hover:text-accent-primary"
                          >
                            {employee.name}
                          </Link>
                          <div className="text-sm text-text-secondary">
                            {employee.position} • {employee.employee_code}
                          </div>
                          {employee.email && (
                            <div className="text-xs text-text-muted flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {employee.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.status === 'active'
                              ? 'bg-success/20 dark:bg-success/30 text-success dark:text-green-400'
                              : 'bg-destructive/20 dark:bg-destructive/30 text-destructive dark:text-red-400'
                          }`}
                        >
                          {employee.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'assets' && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary text-center py-8">
                Asset assignment details will be displayed here. This feature is coming soon.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : usageStats ? (
              <>
                {/* Asset Usage by Department */}
                {usageStats.asset_usage && usageStats.asset_usage.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Usage by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usageStats.asset_usage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="active_assignments" fill="#3b82f6" name="Active Assignments" />
                          <Bar dataKey="employees_with_assets" fill="#10b981" name="Employees with Assets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Ticket Usage by Department */}
                {usageStats.ticket_usage && usageStats.ticket_usage.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Tickets by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usageStats.ticket_usage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="active_tickets" fill="#f59e0b" name="Active Tickets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Asset Value by Department */}
                {usageStats.asset_usage && usageStats.asset_usage.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Asset Value by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usageStats.asset_usage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                          <Legend />
                          <Bar dataKey="total_value" fill="#10b981" name="Total Value (€)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {(!usageStats.asset_usage || usageStats.asset_usage.length === 0) && 
                 (!usageStats.ticket_usage || usageStats.ticket_usage.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center text-text-secondary">
                      No usage statistics available
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-text-secondary">
                  Failed to load usage statistics
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

