import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    // Validate token
    const validateToken = async () => {
      try {
        const result = await api.validateResetToken(tokenParam, emailParam);
        setIsValid(result.valid);
        if (!result.valid) {
          toast.error('This reset link is invalid or has expired. Please request a new one.');
        }
      } catch (error) {
        setIsValid(false);
        toast.error('Failed to validate reset link. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      toast.success('Password reset successfully! You can now log in with your new password.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-text-primary">Validating reset link...</div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary text-center">
              Password reset links expire after 60 minutes. Please request a new one.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Password Reset Successful</CardTitle>
            <CardDescription className="text-center">
              Your password has been reset successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-text-secondary">
              You can now log in with your new password. Redirecting to login page...
            </p>
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-4">
        <Link to="/login">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-text-primary mb-1">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-surface-alt"
              />
            </div>
            <PasswordInput
              id="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showRequirements={true}
              required
            />
            <PasswordInput
              id="password_confirmation"
              label="Confirm New Password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-text-secondary">
            <p>Remember your password?{' '}
              <Link to="/login" className="text-accent-primary hover:text-accent-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

