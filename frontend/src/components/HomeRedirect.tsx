import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function HomeRedirect() {
  const { user, isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is super admin
  const isSuperAdmin = user?.email === 'admin@admin.com';
  
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

