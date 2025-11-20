import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Mail, Server, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Maintenance Mode</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline" disabled>
                Enable Maintenance Mode
              </Button>
              <span className="text-sm text-text-secondary">Coming soon</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Feature Flags</Label>
            <div className="text-sm text-text-secondary">
              Feature flag management coming soon
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure email provider and SMTP settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-text-secondary">
            Email configuration coming soon
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage security policies and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Policy</Label>
              <div className="text-sm text-text-secondary">
                Password policy configuration coming soon
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Rate Limits</Label>
              <div className="text-sm text-text-secondary">
                Rate limit configuration coming soon
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Server Configuration
          </CardTitle>
          <CardDescription>
            View and manage server settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-text-secondary">
            Server configuration coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

