import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { Package, Building2 } from 'lucide-react';
import { api } from '@/services/api';

const TIMEZONES = [
  'UTC',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const COUNTRIES = [
  'Portugal',
  'United States',
  'United Kingdom',
  'Brazil',
  'Spain',
  'France',
  'Germany',
  'Italy',
  'Canada',
  'Australia',
  'Other',
];

export default function Onboarding() {
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  // Redirect super admin to admin panel (super admin doesn't need onboarding)
  const isSuperAdmin = user?.email === 'admin@admin.com';
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    // Check if user already has a company
    if (user?.company_id) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setError('');

    if (!companyName) {
      setError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.onboarding({
        company_name: companyName,
        country: country || null,
        timezone: timezone || 'UTC',
      });
      
      // Refresh user data
      await fetchUser();
      
      toast.success('Company setup completed! Welcome to GearLog.');
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to complete setup';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Setup Your Company</CardTitle>
          </div>
          <CardDescription className="text-center">
            Let's get your company set up in GearLog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setError('');
                }}
                required
                placeholder="Acme Corporation"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>You'll be set up with a free plan that includes:</p>
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Up to 3 users</li>
              <li>Up to 500 products</li>
              <li>Up to 150 tickets per month</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

