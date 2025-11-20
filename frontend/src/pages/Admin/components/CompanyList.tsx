import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CompanyWithStats } from '@/types';

interface CompanyListProps {
  onSelectCompany: (id: number) => void;
  selectedCompanyId: number | null;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CompanyList({ onSelectCompany, selectedCompanyId }: CompanyListProps) {
  const {
    companies,
    isLoading,
    pagination,
    filters,
    fetchCompanies,
    setFilters,
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchCompanies({ page: 1 });
  }, [fetchCompanies]);

  // Update search filter when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearchTerm || undefined };
      setFilters(newFilters);
      fetchCompanies({ page: 1, ...newFilters });
    }
  }, [debouncedSearchTerm]);

  // Sync searchTerm with filters when filters change externally
  useEffect(() => {
    if (filters.search !== searchTerm && filters.search !== undefined) {
      setSearchTerm(filters.search);
    }
  }, [filters.search]);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm || undefined };
    setFilters(newFilters);
    fetchCompanies({ page: 1, ...newFilters });
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchCompanies({ page: 1, ...newFilters });
  };

  const handlePageChange = (page: number) => {
    fetchCompanies({ page, ...filters });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'PRO':
        return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Companies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <select
            value={filters.plan_type || ''}
            onChange={(e) => handleFilterChange('plan_type', e.target.value || undefined)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Plans</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>

          <select
            value={filters.is_active === undefined ? '' : filters.is_active ? 'true' : 'false'}
            onChange={(e) => handleFilterChange('is_active', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Company List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No companies found</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {companies.map((company) => (
              <div
                key={company.id}
                onClick={() => onSelectCompany(company.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCompanyId === company.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {company.users_count || 0} users • {company.products_count || 0} products
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${getPlanBadgeColor(company.plan_type)}`}>
                        {company.plan_type}
                      </span>
                      {company.suspended_at ? (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          Suspended
                        </span>
                      ) : company.is_active ? (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
