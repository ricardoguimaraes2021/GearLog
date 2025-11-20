import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CompanyList from './components/CompanyList';
import CompanyDetails from './components/CompanyDetails';

export default function AdminPanel() {
  const { fetchCompanies, clearError, error } = useAdminStore();
  const { user } = useAuthStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.email === 'admin@admin.com';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [fetchCompanies, isSuperAdmin]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all companies and tenants</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CompanyList
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            selectedCompanyId={selectedCompanyId}
          />
        </div>
        <div className="lg:col-span-2">
          {selectedCompanyId ? (
            <CompanyDetails
              companyId={selectedCompanyId}
              onClose={() => setSelectedCompanyId(null)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500 py-12">
                  Select a company to view details
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
