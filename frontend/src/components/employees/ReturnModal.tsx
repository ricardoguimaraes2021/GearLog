import { useState } from 'react';
import { useAssignmentStore } from '@/stores/assignmentStore';
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
import type { AssetAssignment } from '@/types';

interface ReturnModalProps {
  assignment: AssetAssignment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ assignment, onClose, onSuccess }: ReturnModalProps) {
  const { checkinAsset } = useAssignmentStore();
  const [conditionOnReturn, setConditionOnReturn] = useState('');
  const [productStatus, setProductStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await checkinAsset(assignment.id, {
        condition_on_return: conditionOnReturn || undefined,
        product_status: productStatus || undefined,
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
          <DialogTitle>Return Asset</DialogTitle>
          <DialogDescription>
            Return the asset: {assignment.product?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="condition">Condition on Return</Label>
              <Input
                id="condition"
                value={conditionOnReturn}
                onChange={(e) => setConditionOnReturn(e.target.value)}
                placeholder="e.g., Good condition, minor scratches, etc."
              />
            </div>
            <div>
              <Label htmlFor="status">Update Product Status (Optional)</Label>
              <Select value={productStatus || undefined} onValueChange={(value) => setProductStatus(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the return..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Returning...' : 'Return Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

