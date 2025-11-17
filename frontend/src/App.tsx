import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductDetail from './pages/Products/ProductDetail';
import ProductForm from './pages/Products/ProductForm';
import ProductPublicView from './pages/Products/ProductPublicView';
import Categories from './pages/Categories/Categories';
import Inventory from './pages/Inventory/Inventory';
import Tickets from './pages/Tickets/Tickets';
import TicketDetail from './pages/Tickets/TicketDetail';
import TicketForm from './pages/Tickets/TicketForm';
import TicketDashboard from './pages/Tickets/TicketDashboard';
import Notifications from './pages/Notifications/Notifications';
import Employees from './pages/Employees/Employees';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import EmployeeForm from './pages/Employees/EmployeeForm';
import Departments from './pages/Departments/Departments';
import DepartmentDetail from './pages/Departments/DepartmentDetail';
import DepartmentForm from './pages/Departments/DepartmentForm';
import Layout from './components/layout/Layout';
import { Toaster } from './components/ui/toast';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing/Landing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitializing } = useAuthStore();

  // Wait for initialization to complete before checking authentication
  if (isLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initialize, isInitializing } = useAuthStore();

  useEffect(() => {
    // Only initialize once on mount
    if (!isInitializing) {
      initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  return (
    <ErrorBoundary>
      <Toaster />
      <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products/:id/view" element={<ProductPublicView />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />}>
                <Route index element={<Navigate to="/inventory/products" replace />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="categories" element={<Categories />} />
              </Route>
              <Route path="tickets" element={<Tickets />} />
              <Route path="tickets/dashboard" element={<TicketDashboard />} />
              <Route path="tickets/new" element={<TicketForm />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="tickets/:id/edit" element={<TicketForm />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employees/new" element={<EmployeeForm />} />
              <Route path="employees/:id" element={<EmployeeDetail />} />
              <Route path="employees/:id/edit" element={<EmployeeForm />} />
              <Route path="departments" element={<Departments />} />
              <Route path="departments/new" element={<DepartmentForm />} />
              <Route path="departments/:id" element={<DepartmentDetail />} />
              <Route path="departments/:id/edit" element={<DepartmentForm />} />
            </Route>
          </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

