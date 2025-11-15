import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-8">No data available</div>;
  }

  const kpiCards = [
    {
      title: 'Total Products',
      value: data.kpis.total_products,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Value',
      value: `$${data.kpis.total_value.toLocaleString()}`,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your inventory</p>
      </div>

      {/* KPIs */}
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

      {/* Alerts */}
      {(data.alerts.low_stock > 0 || data.alerts.damaged > 0 || data.alerts.inactive > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.low_stock > 0 && (
                <div className="flex items-center text-orange-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {data.alerts.low_stock} product(s) with low stock
                </div>
              )}
              {data.alerts.damaged > 0 && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {data.alerts.damaged} damaged product(s)
                </div>
              )}
              {data.alerts.inactive > 0 && (
                <div className="flex items-center text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {data.alerts.inactive} product(s) without movement in 30+ days
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

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent_movements.map((movement) => (
              <div key={movement.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">{movement.product?.name}</span>
                  <span className="text-gray-500 ml-2">({movement.type})</span>
                </div>
                <span className="text-gray-600">
                  {new Date(movement.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

