import { useState } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import CompanyList from './CompanyList';
import CompanyDetails from './CompanyDetails';

export default function CompaniesManagement() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  return (
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
          <div className="text-center text-text-secondary py-12 bg-background rounded-lg border border-border">
            Select a company to view details
          </div>
        )}
      </div>
    </div>
  );
}

