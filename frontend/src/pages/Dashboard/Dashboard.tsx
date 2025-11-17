import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

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
                              to={`/products/${product.id}`}
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
                              to={`/products/${product.id}`}
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
                              to={`/products/${product.id}`}
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

