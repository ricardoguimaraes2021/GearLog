import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAssignmentStore } from '@/stores/assignmentStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Mail, Phone, Building2, Package, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import AssignmentModal from '@/components/employees/AssignmentModal';
import ReturnModal from '@/components/employees/ReturnModal';

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentEmployee, fetchEmployee, isLoading, deactivateEmployee, reactivateEmployee } = useEmployeeStore();
  const { fetchHistoryByEmployee, assignments, pagination } = useAssignmentStore();
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [assignmentPage, setAssignmentPage] = useState(1);

  useEffect(() => {
    if (id) {
      fetchEmployee(parseInt(id));
      fetchHistoryByEmployee(parseInt(id), assignmentPage);
    }
  }, [id, assignmentPage]);

  const handleDeactivate = async () => {
    if (!id || !currentEmployee) return;
    if (window.confirm(`Are you sure you want to deactivate ${currentEmployee.name}?`)) {
      try {
        await deactivateEmployee(parseInt(id));
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleReactivate = async () => {
    if (!id || !currentEmployee) return;
    try {
      await reactivateEmployee(parseInt(id));
    } catch (error) {
      // Error handled in store
    }
  };

  if (isLoading || !currentEmployee) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/employees">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{currentEmployee.name}</h1>
            <p className="text-sm text-text-secondary">Employee Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/employees/${currentEmployee.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          {currentEmployee.status === 'active' ? (
            <Button variant="outline" onClick={handleDeactivate}>
              Deactivate
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReactivate}>
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Employee Code</label>
                  <p className="mt-1 font-mono text-text-primary">{currentEmployee.employee_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Status</label>
                  <p className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentEmployee.status === 'active'
                          ? 'bg-success/20 dark:bg-success/30 text-success dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {currentEmployee.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="mt-1 text-text-primary">{currentEmployee.email}</p>
                </div>
                {currentEmployee.phone && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <p className="mt-1 text-text-primary">{currentEmployee.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Department
                  </label>
                  <p className="mt-1 text-text-primary">{currentEmployee.department?.name || 'No Department'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Position</label>
                  <p className="mt-1 font-medium text-text-primary">{currentEmployee.position}</p>
                </div>
                {currentEmployee.notes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-text-secondary">Notes</label>
                    <p className="mt-1 text-text-primary">{currentEmployee.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Assignments */}
          {currentEmployee.active_assignments && currentEmployee.active_assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Asset Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentEmployee.active_assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-accent-primary" />
                          <Link
                            to={`/inventory/products/${assignment.product?.id}`}
                            className="font-medium text-accent-primary hover:text-accent-primary/80 hover:underline"
                          >
                            {assignment.product?.name}
                          </Link>
                        </div>
                        <div className="mt-2 text-sm text-text-secondary">
                          <div>
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                          </div>
                          {assignment.assignedBy && (
                            <div>Assigned by: {assignment.assignedBy.name}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowReturnModal(true);
                        }}
                      >
                        Return
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-text-secondary text-center py-4">No assignment history</p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/inventory/products/${assignment.product?.id}`}
                            className="font-medium text-accent-primary hover:text-accent-primary/80 hover:underline"
                          >
                            {assignment.product?.name}
                          </Link>
                          <div className="mt-2 text-sm text-text-secondary space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Assigned: {new Date(assignment.assigned_at).toLocaleString()}
                            </div>
                            {assignment.returned_at && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Returned: {new Date(assignment.returned_at).toLocaleString()}
                              </div>
                            )}
                            {assignment.assignedBy && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Assigned by: {assignment.assignedBy.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {assignment.returned_at ? (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-xs">
                              Returned
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-accent-primary/20 dark:bg-accent-primary/30 text-accent-primary dark:text-blue-300 rounded text-xs">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pagination && pagination.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignmentPage(assignmentPage - 1)}
                        disabled={assignmentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-text-secondary flex items-center">
                        Page {assignmentPage} of {pagination.last_page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignmentPage(assignmentPage + 1)}
                        disabled={assignmentPage === pagination.last_page}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setShowAssignmentModal(true)}
                disabled={currentEmployee.status !== 'active'}
              >
                <Package className="w-4 h-4 mr-2" />
                Assign Asset
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-text-secondary">Active Assignments</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {currentEmployee.active_assignments?.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Total Assignments</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {currentEmployee.assignments?.length || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showAssignmentModal && (
        <AssignmentModal
          employeeId={currentEmployee.id}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={() => {
            setShowAssignmentModal(false);
            fetchEmployee(parseInt(id!));
            fetchHistoryByEmployee(parseInt(id!), assignmentPage);
          }}
        />
      )}

      {showReturnModal && selectedAssignment && (
        <ReturnModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedAssignment(null);
          }}
          onSuccess={() => {
            setShowReturnModal(false);
            setSelectedAssignment(null);
            fetchEmployee(parseInt(id!));
            fetchHistoryByEmployee(parseInt(id!), assignmentPage);
          }}
        />
      )}
    </div>
  );
}

