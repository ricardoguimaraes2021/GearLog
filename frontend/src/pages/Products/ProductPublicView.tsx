import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types';

export default function ProductPublicView() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await api.getProductPublic(parseInt(id));
        setProduct(data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Product not found' : 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      novo: 'bg-green-100 text-green-800',
      usado: 'bg-blue-100 text-blue-800',
      avariado: 'bg-red-100 text-red-800',
      reparação: 'bg-yellow-100 text-yellow-800',
      reservado: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
              <div>
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
            <Link to="/landing">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-500">Product Information</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="outline">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-lg font-semibold">{product.name}</p>
                </div>
                {product.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="mt-1">{product.category.name}</p>
                  </div>
                )}
                {product.brand && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Brand</label>
                    <p className="mt-1">{product.brand}</p>
                  </div>
                )}
                {product.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="mt-1">{product.model}</p>
                  </div>
                )}
                {product.serial_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serial Number</label>
                    <p className="mt-1 font-mono text-sm">{product.serial_number}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="mt-1 font-semibold text-xl">{product.quantity}</p>
                </div>
                {product.value && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Value</label>
                    <p className="mt-1 font-semibold text-lg">
                      €{product.value.toLocaleString()}
                    </p>
                  </div>
                )}
                {product.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-gray-700">{product.description}</p>
                  </div>
                )}
              </div>

              {product.qr_code_url && (
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-medium text-gray-500">QR Code</label>
                  <div className="mt-2">
                    <img
                      src={api.getStorageUrl(product.qr_code_url) || ''}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Image */}
          {product.image_url && (
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={api.getStorageUrl(product.image_url) || ''}
                  alt={product.name}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Scanned via QR Code • GearLog Inventory Management System</p>
          <p className="mt-2">
            <Link to="/login" className="text-blue-600 hover:underline">
              Login to access full features
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

