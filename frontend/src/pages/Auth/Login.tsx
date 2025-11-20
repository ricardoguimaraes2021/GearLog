import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from '@/utils/toast';
import { loginSchema } from '@/utils/validation';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, isAuthenticated, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to dashboard or admin panel if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      const user = useAuthStore.getState().user;
      const isSuperAdmin = user?.email === 'admin@admin.com';
      if (isSuperAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // Show loading while checking authentication status
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-text-primary">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }

    setError('');

    // Validate
    try {
      loginSchema.parse({ email, password });
    } catch (err: any) {
      if (err.errors?.[0]) {
        const validationError = err.errors[0].message;
        setError(validationError);
        toast.error(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      
      // Check if user needs onboarding
      const user = useAuthStore.getState().user;
      if (user && !user.company_id) {
        navigate('/onboarding');
      } else {
        // Check if user is super admin
        const isSuperAdmin = user?.email === 'admin@admin.com';
        if (isSuperAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Invalid credentials';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-4">
        <Link to="/landing">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">GearLog</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isSubmitting}>
              {isLoading || isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-text-secondary">
            <p>Don't have an account?{' '}
              <Link to="/register" className="text-accent-primary hover:text-accent-primary/80 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

