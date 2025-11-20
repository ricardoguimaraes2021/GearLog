import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { Package, Building2, Users, UserPlus, AlertCircle } from 'lucide-react';
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
  const [onboardingType, setOnboardingType] = useState<'create' | 'join'>('create');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteCompanyName, setInviteCompanyName] = useState<string | null>(null);
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

  const handleValidateInviteCode = async () => {
    if (!inviteCode || inviteCode.length !== 8) {
      setError('Invite code must be 8 characters');
      return;
    }

    setValidatingInvite(true);
    setError('');
    try {
      const result = await api.validateInviteCode(inviteCode.toUpperCase());
      if (result.valid && result.company) {
        setInviteCompanyName(result.company.name);
        toast.success(`Invite code is valid! You'll join ${result.company.name}`);
      } else {
        setError(result.error || 'Invalid invite code');
        setInviteCompanyName(null);
      }
    } catch (err: any) {
      // Handle 404 as invalid invite code
      if (err.response?.status === 404) {
        setError(err.response?.data?.error || 'Invalid or expired invite code');
      } else {
        setError(err.response?.data?.error || 'Failed to validate invite code');
      }
      setInviteCompanyName(null);
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setError('');

    if (onboardingType === 'create') {
      if (!companyName) {
        setError('Company name is required');
        return;
      }
    } else {
      if (!inviteCode || inviteCode.length !== 8) {
        setError('Invite code must be 8 characters');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const onboardingData = onboardingType === 'create' 
        ? {
            company_name: companyName,
            country: country || null,
            timezone: timezone || 'UTC',
          }
        : {
            invite_code: inviteCode.toUpperCase(),
          };

      const result = await api.onboarding(onboardingData);
      
      // Refresh user data
      await fetchUser();
      
      if (onboardingType === 'join' && result.role_assigned === 'viewer') {
        toast.success('You have been added to the company!', {
          description: 'You have been assigned the "Viewer" role. An admin can update your roles later.',
          duration: 6000,
        });
      } else {
        toast.success('Company setup completed! Welcome to GearLog.');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-accent-primary" />
            <CardTitle className="text-2xl text-text-primary">Setup Your Company</CardTitle>
          </div>
          <CardDescription className="text-center text-text-secondary">
            Choose to create a new company or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Onboarding Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={onboardingType === 'create' ? 'default' : 'outline'}
                onClick={() => {
                  setOnboardingType('create');
                  setError('');
                  setInviteCode('');
                  setInviteCompanyName(null);
                }}
                className="w-full"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Create Company
              </Button>
              <Button
                type="button"
                variant={onboardingType === 'join' ? 'default' : 'outline'}
                onClick={() => {
                  setOnboardingType('join');
                  setError('');
                  setCompanyName('');
                  setCountry('');
                  setTimezone('UTC');
                }}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Company
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {onboardingType === 'create' ? (
              <>
                <div>
                  <Label htmlFor="company_name" className="block text-sm font-medium text-text-primary">Company Name *</Label>
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
                  <Label htmlFor="country" className="block text-sm font-medium text-text-primary">Country</Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
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
                  <Label htmlFor="timezone" className="block text-sm font-medium text-text-primary">Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 dark:bg-surface dark:text-text-primary"
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
                <div className="mt-4 text-center text-sm text-text-secondary">
                  <p>You'll be set up with a free plan that includes:</p>
                  <ul className="list-disc list-inside mt-2 text-left text-text-secondary">
                    <li>Up to 3 users</li>
                    <li>Up to 500 products</li>
                    <li>Up to 150 tickets per month</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="invite_code" className="block text-sm font-medium text-text-primary">Invite Code *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="invite_code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                        setInviteCode(value);
                        setError('');
                        setInviteCompanyName(null);
                      }}
                      required
                      placeholder="ABC12345"
                      maxLength={8}
                      className="font-mono text-center text-lg tracking-wider"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateInviteCode}
                      disabled={!inviteCode || inviteCode.length !== 8 || validatingInvite}
                    >
                      {validatingInvite ? 'Validating...' : 'Validate'}
                    </Button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">Enter the 8-character invite code</p>
                </div>

                {inviteCompanyName && (
                  <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary mb-1">
                          You'll join: <span className="text-accent-primary">{inviteCompanyName}</span>
                        </p>
                        <p className="text-xs text-text-secondary">
                          You will be automatically assigned the "Viewer" (Read-only) role. 
                          An admin can update your roles later through User Roles Management.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !inviteCode || inviteCode.length !== 8 || !inviteCompanyName}
                >
                  {isSubmitting ? 'Joining...' : 'Join Company'}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

