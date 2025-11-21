import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Password reset link sent! Please check your email.');
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || 'Failed to send reset link';
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
        <Link to="/login">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {isSubmitted 
              ? 'Check your email for reset instructions'
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-text-muted mb-4">
                  The link will expire in 60 minutes. If you don't see the email, check your spam folder.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  Send another email
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-text-primary">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
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

