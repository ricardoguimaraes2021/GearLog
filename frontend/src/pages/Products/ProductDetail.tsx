import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Edit, AlertTriangle } from 'lucide-react';
import type { Movement } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProduct, fetchProduct, updateProduct, isLoading } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'entry' as Movement['type'],
    quantity: 1,
    assigned_to: '',
    notes: '',
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
    if (!id || !currentProduct) return;

    // Validate quantity before submitting
    if (['exit', 'allocation'].includes(movementData.type)) {
      if (movementData.quantity > currentProduct.quantity) {
        toast.error(
          `Insufficient stock. Available: ${currentProduct.quantity}, requested: ${movementData.quantity}`
        );
        return;
      }
      if (movementData.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
    }

    try {
      await api.createMovement(parseInt(id), movementData);
      await loadMovements();
      await fetchProduct(parseInt(id));
      setShowMovementForm(false);
      setMovementData({
        type: 'entry',
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
                  <div className="mt-1 flex items-center gap-2">
                    <span className="capitalize">{currentProduct.status}</span>
                    <select
                      value={currentProduct.status}
                      onChange={async (e) => {
                        if (!id || !currentProduct) return;
                        const newStatus = e.target.value;
                        if (newStatus === currentProduct.status) return;
                        
                        setIsUpdatingStatus(true);
                        try {
                          const formData = new FormData();
                          formData.append('status', newStatus);
                          await updateProduct(parseInt(id), formData);
                          toast.success('Product status updated successfully');
                        } catch (error: any) {
                          toast.error(error.response?.data?.error || 'Failed to update status');
                        } finally {
                          setIsUpdatingStatus(false);
                        }
                      }}
                      disabled={isUpdatingStatus}
                      className="ml-2 text-sm rounded-md border border-input bg-background px-2 py-1 disabled:opacity-50"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="damaged">Damaged</option>
                      <option value="repair">Repair</option>
                      <option value="reserved">Reserved</option>
                    </select>
                    {isUpdatingStatus && (
                      <span className="text-xs text-gray-500">Updating...</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="mt-1 font-semibold text-lg">{currentProduct.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Value</label>
                  <p className="mt-1">
                    {currentProduct.value
                      ? `€${currentProduct.value.toLocaleString()}`
                      : '-'}
                  </p>
                </div>
                {currentProduct.purchase_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                    <p className="mt-1">
                      {new Date(currentProduct.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {currentProduct.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1">{currentProduct.description}</p>
                  </div>
                )}
              </div>

              {/* Purchase Dates by Entry Movements */}
              {(() => {
                // Group entry movements by date
                const entryMovements = movements.filter(m => m.type === 'entry' || m.type === 'return');
                if (entryMovements.length > 0) {
                  const groupedByDate = entryMovements.reduce((acc, movement) => {
                    const dateKey = new Date(movement.created_at).toLocaleDateString();
                    if (!acc[dateKey]) {
                      acc[dateKey] = { date: dateKey, totalQuantity: 0, movements: [] };
                    }
                    acc[dateKey].totalQuantity += movement.quantity;
                    acc[dateKey].movements.push(movement);
                    return acc;
                  }, {} as Record<string, { date: string; totalQuantity: number; movements: Movement[] }>);

                  const groupedEntries = Object.values(groupedByDate).sort((a, b) => 
                    new Date(b.movements[0].created_at).getTime() - new Date(a.movements[0].created_at).getTime()
                  );

                  return (
                    <div className="mt-6 pt-6 border-t">
                      <label className="text-sm font-medium text-gray-500 mb-3 block">
                        Purchase Dates by Entry
                      </label>
                      <div className="space-y-2">
                        {groupedEntries.map((group, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                          >
                            <div>
                              <span className="font-medium">{group.date}</span>
                              {group.movements.length > 1 && (
                                <span className="text-gray-500 ml-2">
                                  ({group.movements.length} entries)
                                </span>
                              )}
                            </div>
                            <span className="text-gray-600 font-semibold">
                              Qty: {group.totalQuantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {currentProduct.qr_code_url && (
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-medium text-gray-500">QR Code</label>
                  <div className="mt-2">
                    <img
                      src={api.getStorageUrl(currentProduct.qr_code_url) || ''}
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
                        onChange={(e) => {
                          const newType = e.target.value as Movement['type'];
                          // Reset quantity to 1 when changing movement type
                          // If changing to exit/allocation and current quantity exceeds available, set to max available
                          let newQuantity = 1;
                          if (['exit', 'allocation'].includes(newType) && currentProduct) {
                            newQuantity = Math.min(movementData.quantity, currentProduct.quantity) || 1;
                          }
                          setMovementData({ ...movementData, type: newType, quantity: newQuantity });
                        }}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="entry">Entry</option>
                        <option value="exit">Exit</option>
                        <option value="allocation">Allocation</option>
                        <option value="return">Return</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity
                        {['exit', 'allocation'].includes(movementData.type) && currentProduct && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Available: {currentProduct.quantity})
                          </span>
                        )}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max={
                          ['exit', 'allocation'].includes(movementData.type) && currentProduct
                            ? currentProduct.quantity
                            : undefined
                        }
                        value={movementData.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          // Validate max quantity for exit/allocation movements
                          if (['exit', 'allocation'].includes(movementData.type) && currentProduct) {
                            const maxQuantity = currentProduct.quantity;
                            if (value > maxQuantity) {
                              toast.error(`Maximum quantity available is ${maxQuantity}`);
                              return;
                            }
                          }
                          setMovementData({ ...movementData, quantity: value });
                        }}
                        required
                      />
                      {['exit', 'allocation'].includes(movementData.type) &&
                        currentProduct &&
                        movementData.quantity > currentProduct.quantity && (
                          <p className="text-sm text-red-500 mt-1">
                            Quantity cannot exceed available stock ({currentProduct.quantity})
                          </p>
                        )}
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
                  src={api.getStorageUrl(currentProduct.image_url) || ''}
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

