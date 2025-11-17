import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, FolderTree } from 'lucide-react';

export default function Inventory() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Products', href: '/inventory/products', icon: Package },
    { name: 'Categories', href: '/inventory/categories', icon: FolderTree },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.href || 
              (tab.href === '/inventory/products' && location.pathname.startsWith('/inventory/products')) ||
              (tab.href === '/inventory/categories' && location.pathname.startsWith('/inventory/categories'));
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={`
                  inline-flex items-center px-1 pt-4 pb-4 border-b-2 text-sm font-medium
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Render nested routes */}
      <Outlet />
    </div>
  );
}

