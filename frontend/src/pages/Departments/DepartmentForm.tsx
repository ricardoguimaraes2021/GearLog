import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function DepartmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { currentDepartment, fetchDepartment, createDepartment, updateDepartment } = useDepartmentStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_employee_id: '',
    cost_center: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees(1);
    if (isEditing && id) {
      fetchDepartment(parseInt(id));
    }
  }, [id, isEditing, fetchDepartment, fetchEmployees]);

  useEffect(() => {
    if (isEditing && currentDepartment) {
      setFormData({
        name: currentDepartment.name || '',
        description: currentDepartment.description || '',
        manager_employee_id: currentDepartment.manager_employee_id?.toString() || '',
        cost_center: currentDepartment.cost_center || '',
      });
    }
  }, [isEditing, currentDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        ...formData,
        description: formData.description || undefined,
        manager_employee_id: formData.manager_employee_id ? parseInt(formData.manager_employee_id) : undefined,
        cost_center: formData.cost_center || undefined,
      };

      if (isEditing && id) {
        await updateDepartment(parseInt(id), data);
        toast.success('Department updated successfully');
      } else {
        await createDepartment(data);
        toast.success('Department created successfully');
      }
      navigate('/departments');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save department';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/departments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Department' : 'New Department'}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Department' : 'Create Department'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Enter department description..."
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="manager_employee_id">Manager</Label>
              <Select
                value={formData.manager_employee_id || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, manager_employee_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {employees
                    .filter((emp) => emp.status === 'active')
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.employee_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.manager_employee_id && (
                <p className="text-sm text-red-500 mt-1">{errors.manager_employee_id}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cost_center">Cost Center</Label>
              <Input
                id="cost_center"
                value={formData.cost_center}
                onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                placeholder="e.g., CC001"
              />
              {errors.cost_center && (
                <p className="text-sm text-red-500 mt-1">{errors.cost_center}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
              </Button>
              <Link to="/departments">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

