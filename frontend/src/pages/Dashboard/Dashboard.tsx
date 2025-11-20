import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingDown, ChevronDown, ChevronUp, Ticket, Clock, User, Users, Briefcase, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  // Check if user is viewer - viewers cannot access tickets
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  
  // Redirect super admin to admin panel
  const isSuperAdmin = user?.email === 'admin@admin.com';
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  const { data, isLoading, fetchDashboard } = useDashboardStore();
  const [expandedAlerts, setExpandedAlerts] = useState<{
    low_stock: boolean;
    damaged: boolean;
    inactive: boolean;
    sla_violated: boolean;
    sla_at_risk: boolean;
    critical_tickets: boolean;
    unassigned_tickets: boolean;
  }>({
    low_stock: false,
    damaged: false,
    inactive: false,
    sla_violated: false,
    sla_at_risk: false,
    critical_tickets: false,
    unassigned_tickets: false,
  });

  const toggleAlert = (alertType: 'low_stock' | 'damaged' | 'inactive' | 'sla_violated' | 'sla_at_risk' | 'critical_tickets' | 'unassigned_tickets') => {
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
    return <div className="text-center py-8 text-text-secondary">No data available</div>;
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-surface-alt text-text-secondary',
      medium: 'bg-accent-primary/10 text-accent-primary',
      high: 'bg-warning/10 text-warning',
      critical: 'bg-danger/10 text-danger',
    };
    return colors[priority as keyof typeof colors] || 'bg-surface-alt text-text-secondary';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-success/10 text-success',
      in_progress: 'bg-accent-primary/10 text-accent-primary',
      waiting_parts: 'bg-warning/10 text-warning',
      resolved: 'bg-accent-secondary/10 text-accent-secondary',
      closed: 'bg-surface-alt text-text-secondary',
    };
    return colors[status as keyof typeof colors] || 'bg-surface-alt text-text-secondary';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const kpiCards = [
    {
      title: 'Total Products',
      value: data.kpis.total_products,
      icon: Package,
      color: 'text-accent-primary',
    },
    {
      title: 'Total Value',
      value: `€${data.kpis.total_value.toLocaleString()}`,
      icon: Coins,
      color: 'text-success',
    },
    {
      title: 'Damaged Products',
      value: data.kpis.damaged_products,
      icon: AlertTriangle,
      color: 'text-danger',
    },
    {
      title: 'Low Stock',
      value: data.kpis.low_stock_products,
      icon: TrendingDown,
      color: 'text-warning',
    },
  ];

  const ticketKpiCards = data.tickets ? [
    {
      title: 'Open Tickets',
      value: data.tickets.open_tickets,
      icon: Ticket,
      color: 'text-success',
    },
    {
      title: 'In Progress',
      value: data.tickets.in_progress_tickets,
      icon: Clock,
      color: 'text-accent-primary',
    },
    {
      title: 'Critical Tickets',
      value: data.tickets.critical_tickets,
      icon: AlertTriangle,
      color: 'text-danger',
    },
    {
      title: 'Unassigned',
      value: data.tickets.unassigned_tickets,
      icon: User,
      color: 'text-warning',
    },
  ] : [];

  const employeeKpiCards = data.employees ? [
    {
      title: 'Total Employees',
      value: data.employees.total_employees,
      icon: Users,
      color: 'text-accent-primary',
    },
    {
      title: 'Active Employees',
      value: data.employees.active_employees,
      icon: User,
      color: 'text-success',
    },
    {
      title: 'Active Assignments',
      value: data.employees.total_assignments,
      icon: Briefcase,
      color: 'text-accent-secondary',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Overview of your inventory</p>
      </div>

      {/* Product KPIs */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Products Overview</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            const isTotalValue = kpi.title === 'Total Value';
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  {isTotalValue ? (
                    <span className={`text-xl font-normal ${kpi.color}`}>€</span>
                  ) : (
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  )}
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
            <h2 className="text-xl font-semibold text-text-primary">Tickets Overview</h2>
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
            <h2 className="text-xl font-semibold text-text-primary">Employees Overview</h2>
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
      {(data.alerts.low_stock > 0 || 
        data.alerts.damaged > 0 || 
        data.alerts.inactive > 0 ||
        (!isViewer && (
          (data.alerts.sla_violated !== undefined && data.alerts.sla_violated > 0) ||
          (data.alerts.sla_at_risk !== undefined && data.alerts.sla_at_risk > 0) ||
          (data.alerts.critical_tickets !== undefined && data.alerts.critical_tickets > 0) ||
          (data.alerts.unassigned_tickets !== undefined && data.alerts.unassigned_tickets > 0)
        ))) && (
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
                    className="flex items-center justify-between w-full text-left text-warning hover:text-warning/80"
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
                          className="flex items-center justify-between p-2 bg-warning/10 rounded-md text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-text-primary hover:text-warning"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-text-muted ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-text-secondary">Qty: {product.quantity}</span>
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
                    className="flex items-center justify-between w-full text-left text-danger hover:text-danger/80"
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
                          className="flex items-center justify-between p-2 bg-danger/10 rounded-md text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-text-primary hover:text-danger"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-text-muted ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-text-secondary">Qty: {product.quantity}</span>
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
                    className="flex items-center justify-between w-full text-left text-warning hover:text-warning/80"
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
                          className="flex items-center justify-between p-2 bg-warning/10 rounded-md text-sm"
                        >
                          <div>
                            <Link
                              to={`/inventory/products/${product.id}`}
                              className="font-medium text-text-primary hover:text-warning"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <span className="text-text-muted ml-2">({product.category})</span>
                            )}
                          </div>
                          <span className="text-text-secondary">Qty: {product.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* SLA Violated Tickets - hidden for viewers */}
              {!isViewer && data.alerts.sla_violated !== undefined && data.alerts.sla_violated > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('sla_violated')}
                    className="flex items-center justify-between w-full text-left text-danger hover:text-danger/80"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.sla_violated} ticket(s) with SLA violations
                      </span>
                    </div>
                    {expandedAlerts.sla_violated ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.sla_violated && data.alerts.sla_violated_tickets && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.sla_violated_tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-danger/10 rounded-md text-sm"
                        >
                          <div className="flex-1">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="font-medium text-text-primary hover:text-danger"
                            >
                              #{ticket.id} - {ticket.title}
                            </Link>
                            <div className="text-xs text-text-muted mt-1">
                              {ticket.product && (
                                <span>Product: {ticket.product}</span>
                              )}
                              {ticket.assigned_to && (
                                <span className="ml-2">Assigned to: {ticket.assigned_to}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* SLA At Risk Tickets - hidden for viewers */}
              {!isViewer && data.alerts.sla_at_risk !== undefined && data.alerts.sla_at_risk > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('sla_at_risk')}
                    className="flex items-center justify-between w-full text-left text-warning hover:text-warning/80"
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.sla_at_risk} ticket(s) at risk of SLA violation
                      </span>
                    </div>
                    {expandedAlerts.sla_at_risk ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.sla_at_risk && data.alerts.sla_at_risk_tickets && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.sla_at_risk_tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-warning/10 rounded-md text-sm"
                        >
                          <div className="flex-1">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="font-medium text-text-primary hover:text-warning"
                            >
                              #{ticket.id} - {ticket.title}
                            </Link>
                            <div className="text-xs text-text-muted mt-1">
                              {ticket.product && (
                                <span>Product: {ticket.product}</span>
                              )}
                              {ticket.assigned_to && (
                                <span className="ml-2">Assigned to: {ticket.assigned_to}</span>
                              )}
                              {(ticket.first_response_at_risk || ticket.resolution_at_risk) && (
                                <span className="ml-2 text-orange-600">
                                  {ticket.first_response_at_risk && ticket.resolution_at_risk
                                    ? 'First Response & Resolution at risk'
                                    : ticket.first_response_at_risk
                                    ? 'First Response at risk'
                                    : 'Resolution at risk'}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Critical Tickets - hidden for viewers */}
              {!isViewer && data.alerts.critical_tickets !== undefined && data.alerts.critical_tickets > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('critical_tickets')}
                    className="flex items-center justify-between w-full text-left text-danger hover:text-danger/80"
                  >
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.critical_tickets} critical ticket(s) open
                      </span>
                    </div>
                    {expandedAlerts.critical_tickets ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.critical_tickets && data.alerts.critical_tickets_list && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.critical_tickets_list.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-danger/10 rounded-md text-sm"
                        >
                          <div className="flex-1">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="font-medium text-text-primary hover:text-danger"
                            >
                              #{ticket.id} - {ticket.title}
                            </Link>
                            <div className="text-xs text-text-muted mt-1">
                              {ticket.product && (
                                <span>Product: {ticket.product}</span>
                              )}
                              {ticket.assigned_to && (
                                <span className="ml-2">Assigned to: {ticket.assigned_to}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {formatStatus(ticket.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Unassigned Tickets - hidden for viewers */}
              {!isViewer && data.alerts.unassigned_tickets !== undefined && data.alerts.unassigned_tickets > 0 && (
                <div className="border-b pb-4 last:border-b-0 last:pb-0">
                  <button
                    onClick={() => toggleAlert('unassigned_tickets')}
                    className="flex items-center justify-between w-full text-left text-warning hover:text-warning/80"
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {data.alerts.unassigned_tickets} unassigned ticket(s)
                      </span>
                    </div>
                    {expandedAlerts.unassigned_tickets ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedAlerts.unassigned_tickets && data.alerts.unassigned_tickets_list && (
                    <div className="mt-3 ml-6 space-y-2">
                      {data.alerts.unassigned_tickets_list.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-warning/10 rounded-md text-sm"
                        >
                          <div className="flex-1">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="font-medium text-text-primary hover:text-warning"
                            >
                              #{ticket.id} - {ticket.title}
                            </Link>
                            <div className="text-xs text-text-muted mt-1">
                              {ticket.product && (
                                <span>Product: {ticket.product}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
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
                <p className="text-sm text-text-secondary text-center py-4">No recent activities</p>
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
                                className="font-medium text-accent-primary hover:underline"
                              >
                                {activity.product?.name}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-md text-xs ${
                                isReturn 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-accent-primary/10 text-accent-primary'
                              }`}>
                                {isReturn ? 'Returned' : 'Assigned'}
                              </span>
                            </div>
                            <div className="text-text-secondary mt-1">
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
                              className="font-medium text-accent-primary hover:underline"
                            >
                              {activity.product?.name}
                            </Link>
                            <span className="text-text-muted ml-2 capitalize">
                              ({activity.movement_type || activity.type})
                            </span>
                            {activity.quantity && (
                              <span className="text-text-secondary ml-2">Qty: {activity.quantity}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-text-muted text-xs whitespace-nowrap ml-4">
                        {new Date(timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tickets - hidden for viewers */}
        {!isViewer && data.recent_tickets && data.recent_tickets.length > 0 && (
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
                    className="block p-3 rounded-md hover:bg-surface-alt border border-border transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary truncate">{ticket.title}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
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
                        <span className="text-xs text-text-muted">
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

