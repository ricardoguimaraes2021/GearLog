import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Edit } from 'lucide-react';
import type { Movement } from '@/types';
import { toast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProduct, fetchProduct, isLoading } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'entrada' as Movement['type'],
    quantity: 1,
    assigned_to: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
      loadMovements();
    }
    fetchCategories();
  }, [id]);

  const loadMovements = async () => {
    if (!id) return;
    try {
      const response = await api.getProductMovements(parseInt(id));
      setMovements(response.data);
    } catch (error) {
      console.error('Failed to load movements:', error);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await api.createMovement(parseInt(id), movementData);
      await loadMovements();
      await fetchProduct(parseInt(id));
      setShowMovementForm(false);
      setMovementData({
        type: 'entrada',
        quantity: 1,
        assigned_to: '',
        notes: '',
      });
      toast.success('Movement created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create movement');
    }
  };

  if (isLoading || !currentProduct) {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentProduct.name}</h1>
            <p className="text-sm text-gray-500">Product Details</p>
          </div>
        </div>
        <Link to={`/products/${currentProduct.id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1">{currentProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1">{currentProduct.category?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <p className="mt-1">{currentProduct.brand || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="mt-1">{currentProduct.model || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1">{currentProduct.serial_number || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1 capitalize">{currentProduct.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="mt-1 font-semibold text-lg">{currentProduct.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Value</label>
                  <p className="mt-1">
                    {currentProduct.value
                      ? `$${currentProduct.value.toLocaleString()}`
                      : '-'}
                  </p>
                </div>
                {currentProduct.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1">{currentProduct.description}</p>
                  </div>
                )}
              </div>

              {currentProduct.qr_code_url && (
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-medium text-gray-500">QR Code</label>
                  <div className="mt-2">
                    <img
                      src={`http://localhost:8000/storage/${currentProduct.qr_code_url}`}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movements */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Movements</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowMovementForm(!showMovementForm)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Movement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showMovementForm && (
                <form onSubmit={handleCreateMovement} className="mb-6 p-4 border rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={movementData.type}
                        onChange={(e) =>
                          setMovementData({ ...movementData, type: e.target.value as Movement['type'] })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                        <option value="alocacao">Alocação</option>
                        <option value="devolucao">Devolução</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={movementData.quantity}
                        onChange={(e) =>
                          setMovementData({ ...movementData, quantity: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Assigned To</label>
                      <Input
                        value={movementData.assigned_to}
                        onChange={(e) =>
                          setMovementData({ ...movementData, assigned_to: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea
                        value={movementData.notes}
                        onChange={(e) =>
                          setMovementData({ ...movementData, notes: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Movement
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMovementForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {movements.length === 0 ? (
                  <p className="text-sm text-gray-500">No movements yet</p>
                ) : (
                  movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium capitalize">{movement.type}</div>
                        <div className="text-sm text-gray-500">
                          Quantity: {movement.quantity}
                          {movement.assigned_to && ` • Assigned to: ${movement.assigned_to}`}
                        </div>
                        {movement.notes && (
                          <div className="text-sm text-gray-600 mt-1">{movement.notes}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {currentProduct.image_url && (
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={`http://localhost:8000/storage/${currentProduct.image_url}`}
                  alt={currentProduct.name}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

