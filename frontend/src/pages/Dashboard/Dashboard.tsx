import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingDown, ChevronDown, ChevronUp, Ticket, Clock, User, Users, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data, isLoading, fetchDashboard } = useDashboardStore();
  const [expandedAlerts, setExpandedAlerts] = useState<{
    low_stock: boolean;
    damaged: boolean;
    inactive: boolean;
  }>({
    low_stock: false,
    damaged: false,
    inactive: false,
  });

  const toggleAlert = (alertType: 'low_stock' | 'damaged' | 'inactive') => {
    setExpandedAlerts((prev) => ({
      ...prev,
      [alertType]: !prev[alertType],
    }));
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_parts: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const kpiCards = [
    {
      title: 'Total Products',
      value: data.kpis.total_products,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Value',
      value: `€${data.kpis.total_value.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Damaged Products',
      value: data.kpis.damaged_products,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Low Stock',
      value: data.kpis.low_stock_products,
      icon: TrendingDown,
      color: 'text-orange-600',
    },
  ];

  const ticketKpiCards = data.tickets ? [
    {
      title: 'Open Tickets',
      value: data.tickets.open_tickets,
      icon: Ticket,
      color: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: data.tickets.in_progress_tickets,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Critical Tickets',
      value: data.tickets.critical_tickets,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Unassigned',
      value: data.tickets.unassigned_tickets,
      icon: User,
      color: 'text-orange-600',
    },
  ] : [];

  const employeeKpiCards = data.employees ? [
    {
      title: 'Total Employees',
      value: data.employees.total_employees,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Employees',
      value: data.employees.active_employees,
      icon: User,
      color: 'text-green-600',
    },
    {
      title: 'Active Assignments',
      value: data.employees.total_assignments,
      icon: Briefcase,
      color: 'text-purple-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your inventory</p>
      </div>

      {/* Product KPIs */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Products Overview</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Ticket KPIs */}
      {ticketKpiCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tickets Overview</h2>
            <Link to="/tickets/dashboard">
              <Button variant="outline" size="sm">
                View Full Dashboard
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ticketKpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee KPIs */}
      {employeeKpiCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Employees Overview</h2>
            <Link to="/employees">
              <Button variant="outline" size="sm">
                View All Employees
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {employeeKpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {(data.alerts.low_stock > 0 || data.alerts.damaged > 0 || data.alerts.inactive > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.alerts.low_stock > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('low_stock')}
                    className="flex items-center justify-between w-full text-left text-orange-600 hover:text-orange-700"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.low_stock} product(s) with low stock
                      </span>
                    </div>
                    {expandedAlerts.low_stock ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.low_stock && data.alerts.low_stock_products && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.low_stock_products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-gray-900 hover:text-orange-600"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-gray-500 ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-gray-600">Qty: {product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {data.alerts.damaged > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('damaged')}
                    className="flex items-center justify-between w-full text-left text-red-600 hover:text-red-700"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.damaged} damaged product(s)
                      </span>
                    </div>
                    {expandedAlerts.damaged ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.damaged && data.alerts.damaged_products && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.damaged_products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-red-50 rounded text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-gray-900 hover:text-red-600"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-gray-500 ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-gray-600">Qty: {product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {data.alerts.inactive > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('inactive')}
                    className="flex items-center justify-between w-full text-left text-yellow-600 hover:text-yellow-700"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.inactive} product(s) without movement in 30+ days
                      </span>
                    </div>
                    {expandedAlerts.inactive ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.inactive && data.alerts.inactive_products && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.inactive_products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-gray-900 hover:text-yellow-600"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-gray-500 ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-gray-600">Qty: {product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.products_by_category.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span>{item.name}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements & Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_movements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
              ) : (
                data.recent_movements.map((activity: any) => {
                  const isAssignment = activity.type === 'assignment_checkout' || activity.type === 'assignment_return';
                  const isReturn = activity.type === 'assignment_return';
                  const timestamp = activity.timestamp || activity.created_at || activity.assigned_at || activity.returned_at;
                  
                  return (
                    <div key={activity.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        {isAssignment ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/inventory/products/${activity.product?.id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {activity.product?.name}
                              </Link>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isReturn 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isReturn ? 'Returned' : 'Assigned'}
                              </span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              {isReturn ? (
                                <>
                                  Returned by{' '}
                                  <Link
                                    to={`/employees/${activity.employee?.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {activity.employee?.name}
                                  </Link>
                                </>
                              ) : (
                                <>
                                  Assigned to{' '}
                                  <Link
                                    to={`/employees/${activity.employee?.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {activity.employee?.name}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Link
                              to={`/inventory/products/${activity.product?.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {activity.product?.name}
                            </Link>
                            <span className="text-gray-500 ml-2 capitalize">
                              ({activity.movement_type || activity.type})
                            </span>
                            {activity.quantity && (
                              <span className="text-gray-600 ml-2">Qty: {activity.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs whitespace-nowrap ml-4">
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        {data.recent_tickets && data.recent_tickets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Tickets</CardTitle>
                <Link to="/tickets">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recent_tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="block p-3 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">{ticket.title}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {ticket.product && (
                            <>
                              <Package className="w-3 h-3" />
                              <span>{ticket.product}</span>
                            </>
                          )}
                          {ticket.assigned_to && (
                            <>
                              <User className="w-3 h-3 ml-2" />
                              <span>{ticket.assigned_to}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {formatStatus(ticket.status)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

