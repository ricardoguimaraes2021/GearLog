import { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
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
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all companies and tenants</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                Select a company to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

