import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewerRestriction from '@/components/ViewerRestriction';

export default function EmployeeForm() {
  const { user } = useAuthStore();
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { currentEmployee, fetchEmployee, createEmployee, updateEmployee, isLoading } = useEmployeeStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDepartments();
    if (isEditing && id) {
      fetchEmployee(parseInt(id));
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (isEditing && currentEmployee) {
      setFormData({
        employee_code: currentEmployee.employee_code || '',
        name: currentEmployee.name,
        email: currentEmployee.email,
        phone: currentEmployee.phone || '',
        department_id: currentEmployee.department_id?.toString() || '',
        position: currentEmployee.position,
        status: currentEmployee.status,
        notes: currentEmployee.notes || '',
      });
    }
  }, [currentEmployee, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!formData.position.trim()) {
      setErrors({ position: 'Position is required' });
      return;
    }
    
    // Phone validation - only numbers, spaces, +, -, and parentheses
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      setErrors({ phone: 'Phone number can only contain numbers, spaces, +, -, and parentheses' });
      return;
    }

    try {
      const data = {
        ...formData,
        employee_code: formData.employee_code || undefined,
        phone: formData.phone || undefined,
        department_id: formData.department_id && formData.department_id !== 'none' ? parseInt(formData.department_id) : undefined,
        notes: formData.notes || undefined,
      };

      if (isEditing && id) {
        await updateEmployee(parseInt(id), data);
      } else {
        await createEmployee(data);
      }
      navigate('/employees');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  // Show restriction message for viewers
  if (isViewer) {
    return (
      <div className="space-y-6">
        <ViewerRestriction
          title="Cannot Create or Edit Employees"
          description="Your current role does not allow creating or editing employees"
          action="You can only view employees. To create or edit employees, please contact your company owner or administrator to update your role."
          backUrl="/employees"
          backLabel="Back to Employees"
        />
      </div>
    );
  }

  if (isLoading && isEditing) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {isEditing ? 'Edit Employee' : 'Add Employee'}
          </h1>
          <p className="text-sm text-text-secondary">
            {isEditing ? 'Update employee information' : 'Create a new employee'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_code">Employee Code</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  placeholder="Auto-generated if left empty"
                  disabled={isEditing}
                />
                {errors.employee_code && (
                  <p className="text-sm text-destructive mt-1">{errors.employee_code}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    // Only allow numbers, spaces, +, -, and parentheses for country codes
                    const value = e.target.value.replace(/[^\d+\-() ]/g, '');
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="+1234567890 or (123) 456-7890"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select
                  value={formData.department_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department_id && (
                  <p className="text-sm text-destructive mt-1">{errors.department_id}</p>
                )}
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
                {errors.position && (
                  <p className="text-sm text-destructive mt-1">{errors.position}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Internal notes about this employee..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Employee
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

