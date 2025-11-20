import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Building2, Users, Package, Ticket, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ViewerRestriction from '@/components/ViewerRestriction';

export default function Departments() {
  const { user } = useAuthStore();
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  const {
    departments,
    isLoading,
    filters,
    fetchDepartments,
    setFilters,
    resetFilters,
    deleteDepartment,
  } = useDepartmentStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value });
  };

  const handleDelete = async (id: number, name: string) => {
    if (isViewer) {
      toast.error('You do not have permission to delete departments. Please contact your administrator to update your role.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete department "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDepartment(id);
        toast.success('Department deleted successfully');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete department');
      }
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      dept.name.toLowerCase().includes(search) ||
      dept.description?.toLowerCase().includes(search) ||
      dept.cost_center?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Departments</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage organizational departments and their assets</p>
        </div>
        {!isViewer && (
          <Link to="/departments/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </Link>
        )}
      </div>

      {isViewer && (
        <ViewerRestriction
          title="Read-Only Access to Departments"
          description="You can view departments but cannot create, edit, or delete them"
          action="To manage departments, please contact your company owner or administrator to update your role."
          compact={true}
        />
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search departments by name, description, or cost center..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {searchTerm ? 'No departments found matching your search' : 'No departments found'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <Card key={department.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    {department.name}
                  </CardTitle>
                </div>
                {department.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{department.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {department.cost_center && (
                    <div className="text-sm">
                      <span className="text-gray-500">Cost Center:</span>{' '}
                      <span className="font-medium">{department.cost_center}</span>
                    </div>
                  )}
                  <div className="text-sm min-h-[20px]">
                    {department.manager ? (
                      <>
                        <span className="text-gray-500">Manager:</span>{' '}
                        <span className="font-medium">{department.manager.name}</span>
                      </>
                    ) : (
                      <span className="invisible">Manager:</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-500 mb-1">
                        <Users className="w-4 h-4 mr-1" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {department.employees?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">Employees</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-500 mb-1">
                        <Package className="w-4 h-4 mr-1" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {department.total_assigned_assets || 0}
                      </div>
                      <div className="text-xs text-gray-500">Assets</div>
                    </div>
                  </div>

                  {department.total_asset_value !== undefined && department.total_asset_value > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total Value:</span>
                        <span className="font-semibold text-green-600">
                          €{department.total_asset_value.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link to={`/departments/${department.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    {!isViewer && (
                      <>
                        <Link to={`/departments/${department.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(department.id, department.name)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

