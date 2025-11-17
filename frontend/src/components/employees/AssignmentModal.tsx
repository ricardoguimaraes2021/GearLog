import { useState, useEffect } from 'react';
import { useAssignmentStore } from '@/stores/assignmentStore';
import { useProductStore } from '@/stores/productStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssignmentModalProps {
  employeeId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignmentModal({ employeeId, onClose, onSuccess }: AssignmentModalProps) {
  const { checkoutAsset } = useAssignmentStore();
  const { products, fetchProducts } = useProductStore();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts(1);
  }, []);

  // Filter products that can be assigned
  const assignableProducts = products.filter((product) => {
    // Only show products with status: new, used, repair
    // and quantity > 0
    return ['new', 'used', 'repair'].includes(product.status) && product.quantity > 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsLoading(true);
    try {
      await checkoutAsset({
        product_id: selectedProductId,
        employee_id: employeeId,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (error) {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset to Employee</DialogTitle>
          <DialogDescription>
            Select an asset to assign to this employee. Only available assets can be assigned.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="product">Product *</Label>
              <Select
                value={selectedProductId?.toString() || ''}
                onValueChange={(value) => setSelectedProductId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {assignableProducts.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No assignable products available
                    </div>
                  ) : (
                    assignableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.status} (Qty: {product.quantity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedProductId || isLoading}>
              {isLoading ? 'Assigning...' : 'Assign Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

