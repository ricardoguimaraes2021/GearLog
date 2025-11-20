import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LayoutDashboard, Package, Ticket, Users, Building2, LogOut, Menu, X, Shield, User, Settings } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from '@/components/notifications/NotificationBell';
import PageTransition from '@/components/PageTransition';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect super admin to admin panel (super admin should not use this layout)
  const isSuperAdmin = user?.email === 'admin@admin.com';
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Check if user is viewer - viewers cannot access tickets
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory/products', icon: Package },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Departments', href: '/departments', icon: Building2 },
    ...(isViewer ? [] : [{ name: 'Tickets', href: '/tickets', icon: Ticket }]),
  ];

  const handleLogout = async () => {
    await logout();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard">
                  <h1 className="text-xl font-bold text-text-primary hover:text-accent-primary cursor-pointer transition-colors">
                    GearLog
                  </h1>
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
                    (item.href === '/inventory/products' && (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/products') || location.pathname.startsWith('/categories')));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-accent-primary text-text-primary'
                          : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile menu button */}
              <div className="sm:hidden ml-4 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>
            {/* Desktop user info, notifications and logout */}
            <div className="hidden sm:flex items-center space-x-4">
              <ThemeToggle />
              <NotificationBell />
              <Link
                to="/profile"
                className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                {user?.name}
              </Link>
              <Link
                to="/settings"
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-surface">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href)) ||
                (item.href === '/inventory/products' && (location.pathname.startsWith('/inventory') || location.pathname.startsWith('/products') || location.pathname.startsWith('/categories')));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary border-l-4 border-accent-primary'
                      : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <div className="border-t border-border pt-4 pb-3">
              <div className="px-3 mb-3">
                <div className="text-base font-medium text-text-primary">{user?.name}</div>
                <div className="text-sm font-medium text-text-secondary">{user?.email}</div>
              </div>
              <div className="px-3 mb-3">
                <ThemeToggle variant="outline" size="sm" className="w-full justify-start" />
              </div>
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={closeMobileMenu}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                onClick={async () => {
                  closeMobileMenu();
                  await handleLogout();
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <PageTransition animationType="fade">
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}

