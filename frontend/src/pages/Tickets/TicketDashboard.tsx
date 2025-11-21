import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, AlertTriangle, Clock, User, TrendingUp, Package, FolderTree, ShieldAlert, CheckCircle2, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface TicketDashboardData {
  kpis: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    critical_tickets: number;
    unassigned_tickets: number;
    resolved_tickets: number;
    resolution_rate: number;
    average_resolution_time_minutes: number;
    sla_violated_tickets?: number;
    first_response_violated?: number;
    resolution_violated?: number;
    sla_at_risk?: number;
    sla_compliance_rate?: number;
  };
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
  by_technician: Array<{ id: number; name: string; count: number }>;
  by_product: Array<{ id: number; name: string; count: number }>;
  by_category: Array<{ name: string; count: number }>;
  recent_tickets: any[];
  urgent_tickets: any[];
  compliance_trend?: Array<{
    date: string;
    compliance_rate: number | null;
    total_resolved: number;
    within_sla: number;
  }>;
}

export default function TicketDashboard() {
  const { user } = useAuthStore();
  
  // Check if user is viewer - viewers cannot access tickets
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  
  const [data, setData] = useState<TicketDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Show access denied message for viewers
  if (isViewer) {
    return (
      <div className="space-y-6">
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-warning" />
              <div>
                <CardTitle className="text-text-primary">Access Restricted</CardTitle>
                <CardDescription className="text-text-secondary">
                  Your current role does not allow access to tickets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
                <AlertTriangle className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-text-primary font-medium mb-2">
                    Viewer Role Limitations
                  </p>
                  <p className="text-text-secondary text-sm mb-3">
                    As a Viewer, you have read-only access. To access ticket analytics and dashboards, please contact your company owner or administrator to update your role.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/tickets">Back to Tickets</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.getTicketDashboard();
      setData(response);
    } catch (error: any) {
      toast.error('Failed to load ticket dashboard');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const hrs = hours % 24;
    return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48 mb-2" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const kpiCards = [
    {
      title: 'Total Tickets',
      value: data.kpis.total_tickets,
      icon: Ticket,
      color: 'text-blue-600',
    },
    {
      title: 'Open Tickets',
      value: data.kpis.open_tickets,
      icon: AlertTriangle,
      color: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: data.kpis.in_progress_tickets,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Critical Tickets',
      value: data.kpis.critical_tickets,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Unassigned',
      value: data.kpis.unassigned_tickets,
      icon: User,
      color: 'text-orange-600',
    },
    {
      title: 'Resolved',
      value: data.kpis.resolved_tickets,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Resolution Rate',
      value: `${data.kpis.resolution_rate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Avg Resolution Time',
      value: formatTime(data.kpis.average_resolution_time_minutes),
      icon: Clock,
      color: 'text-gray-600',
    },
  ];

  const slaKpiCards = data.kpis.sla_violated_tickets !== undefined ? [
    {
      title: 'SLA Violated',
      value: data.kpis.sla_violated_tickets || 0,
      icon: ShieldAlert,
      color: 'text-red-600',
    },
    {
      title: 'First Response Violated',
      value: data.kpis.first_response_violated || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Resolution Violated',
      value: data.kpis.resolution_violated || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'SLA At Risk',
      value: data.kpis.sla_at_risk || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
    {
      title: 'SLA Compliance',
      value: `${data.kpis.sla_compliance_rate || 0}%`,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ticket Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of ticket system metrics and statistics</p>
      </div>

      {/* KPIs */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket Overview</h2>
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

      {/* SLA KPIs */}
      {slaKpiCards.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SLA Metrics</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {slaKpiCards.map((kpi) => {
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

      {/* SLA Compliance Trend Chart */}
      {data.compliance_trend && data.compliance_trend.length > 0 && (() => {
        // Filter out days with no data (null compliance_rate and total_resolved = 0)
        const chartData = data.compliance_trend.filter(
          (item) => item.compliance_rate !== null || item.total_resolved > 0
        );
        
        // Only show chart if there's at least one day with data
        if (chartData.length === 0) {
          return null;
        }
        
        return (
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance Trend (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    label={{ value: 'Compliance Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined) return 'No data';
                      if (name === 'compliance_rate') {
                        return `${value}%`;
                      }
                      return value;
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="compliance_rate" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Compliance Rate (%)"
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                <p>Shows the daily SLA compliance rate for resolved tickets over the last 30 days.</p>
                {chartData.length < data.compliance_trend.length && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only days with resolved tickets are shown.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{formatStatus(status)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status).split(' ')[0]}`}
                        style={{
                          width: `${data.kpis.total_tickets > 0 ? (count / data.kpis.total_tickets) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.by_priority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{priority}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getPriorityColor(priority).split(' ')[0]}`}
                        style={{
                          width: `${data.kpis.total_tickets > 0 ? (count / data.kpis.total_tickets) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${data.kpis.total_tickets > 0 ? (count / data.kpis.total_tickets) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Technician */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Technician</CardTitle>
          </CardHeader>
          <CardContent>
            {data.by_technician.length > 0 ? (
              <div className="space-y-2">
                {data.by_technician.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{tech.name}</span>
                    <span className="text-sm font-medium">{tech.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tickets assigned yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tickets */}
      {data.urgent_tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Urgent Tickets ({data.urgent_tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.urgent_tickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-red-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{ticket.title}</div>
                    <div className="text-sm text-gray-500">
                      {ticket.product?.name || 'No product'} • {ticket.assignedTo?.name || 'Unassigned'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent_tickets.map((ticket: any) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{ticket.title}</div>
                  <div className="text-sm text-gray-500">
                    {ticket.product?.name || 'No product'} • {ticket.opened_by?.name || 'Unknown'} •{' '}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tickets by Product (Damage) */}
      {data.by_product.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Most Reported Products (Damage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.by_product.map((product) => (
                <Link
                  key={product.id}
                  to={`/inventory/products/${product.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-600">{product.name}</span>
                  <span className="text-sm font-medium">{product.count} ticket(s)</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets by Category (Damage) */}
      {data.by_category.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              Damage Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.by_category.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-md">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <span className="text-sm font-medium">{category.count} ticket(s)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

