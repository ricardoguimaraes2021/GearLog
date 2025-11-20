import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { User, Lock, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProfile() {
  const { user, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Check if user is super admin
  const isSuperAdmin = user?.email === 'admin@admin.com';

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updateProfile(formData);
      await fetchUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updatePassword(passwordData);
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setShowPasswordModal(false);
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
              <h1 className="text-xl font-bold text-text-primary">GearLog</h1>
              <span className="ml-4 px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-primary">{user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Profile Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your account information</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-surface-alt"
                    />
                    <p className="text-xs text-text-secondary">Email cannot be changed</p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: user?.name || '' });
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Name</Label>
                    <p className="mt-1 text-sm font-semibold text-text-primary">{user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Email</Label>
                    <p className="mt-1 text-sm text-text-primary">{user?.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordModal ? (
                <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, current_password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={passwordData.password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          password_confirmation: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordData({
                          current_password: '',
                          password: '',
                          password_confirmation: '',
                        });
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

