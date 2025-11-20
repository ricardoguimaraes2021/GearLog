import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, Lock, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityLog {
  id: number;
  type: 'login' | 'failed_login' | 'suspicious_activity' | 'password_reset' | 'rate_limit';
  description: string;
  user_id?: number;
  user_email?: string;
  ip_address?: string;
  created_at: string;
}

export default function SecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityLogs();
  }, []);

  const loadSecurityLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminSecurityLogs();
      setLogs(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load security logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'suspicious_activity':
        return <Shield className="w-5 h-5 text-orange-500" />;
      case 'password_reset':
        return <Lock className="w-5 h-5 text-blue-500" />;
      case 'rate_limit':
        return <UserX className="w-5 h-5 text-purple-500" />;
      default:
        return <Shield className="w-5 h-5 text-text-muted" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'failed_login':
        return 'border-red-200 bg-red-50';
      case 'suspicious_activity':
        return 'border-orange-200 bg-orange-50';
      case 'password_reset':
        return 'border-blue-200 bg-blue-50';
      case 'rate_limit':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-border bg-background';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security & Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center text-text-muted py-8">
              <Shield className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <p>No security logs available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 border rounded-lg ${getLogColor(log.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary capitalize">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary mt-1">{log.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        {log.user_email && (
                          <span>User: {log.user_email}</span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

