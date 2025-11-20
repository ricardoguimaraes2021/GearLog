import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield, 
  Settings, 
  TrendingUp,
  LogOut,
  User
} from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import CompaniesManagement from './components/CompaniesManagement';
import UsersManagement from './components/UsersManagement';
import AnalyticsReports from './components/AnalyticsReports';
import SecurityLogs from './components/SecurityLogs';
import SystemSettings from './components/SystemSettings';

type AdminTab = 'dashboard' | 'companies' | 'users' | 'analytics' | 'security' | 'settings';

export default function AdminPanel() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Check if user is super admin (email-based check)
  const isSuperAdmin = user?.email === 'admin@admin.com';

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'dashboard' as AdminTab, name: 'Dashboard', icon: BarChart3 },
    { id: 'companies' as AdminTab, name: 'Companies', icon: Building2 },
    { id: 'users' as AdminTab, name: 'Users', icon: Users },
    { id: 'analytics' as AdminTab, name: 'Analytics', icon: TrendingUp },
    { id: 'security' as AdminTab, name: 'Security Logs', icon: Shield },
    { id: 'settings' as AdminTab, name: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-text-primary">GearLog</h1>
              <span className="ml-4 px-2 py-1 text-xs rounded bg-accent-secondary/20 text-accent-secondary">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/profile')}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Super Admin Panel</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Global system administration console for managing the entire GearLog SaaS ecosystem
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-accent-primary text-accent-primary'
                      : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'companies' && <CompaniesManagement />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'analytics' && <AnalyticsReports />}
          {activeTab === 'security' && <SecurityLogs />}
          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}
