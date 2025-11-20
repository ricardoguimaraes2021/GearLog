import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ViewerRestrictionProps {
  title?: string;
  description?: string;
  action?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
  compact?: boolean; // New prop to control if text should be removed
}

export default function ViewerRestriction({
  title = 'Access Restricted',
  description = 'Your current role does not allow this action',
  action,
  showBackButton = true,
  backUrl = '/dashboard',
  backLabel = 'Go to Dashboard',
  compact = false, // Default to false to maintain backward compatibility
}: ViewerRestrictionProps) {
  const { user } = useAuthStore();
  const isViewer = user?.roles?.some((r) => r.name === 'viewer') ?? false;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isViewer) {
    return null;
  }

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Shield className="w-8 h-8 text-warning" />
            <div>
              <CardTitle className="text-text-primary">{title}</CardTitle>
              {!isExpanded && (
                <CardDescription className="text-text-secondary">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
              <AlertCircle className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-text-primary font-medium mb-2">
                  Viewer Role Limitations
                </p>
                <p className="text-text-secondary text-sm mb-3">
                  As a Viewer, you have read-only access to the following:
                </p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm mb-3">
                  <li>Dashboard metrics and statistics</li>
                  <li>Products and inventory</li>
                  <li>Employees and departments</li>
                  <li>Categories</li>
                </ul>
                {action && (
                  <p className="text-text-secondary text-sm mb-2">
                    {action}
                  </p>
                )}
                {!compact && (
                  <>
                    <p className="text-text-secondary text-sm mb-2">
                      To access this feature, please contact your company owner or administrator to update your role.
                    </p>
                    <p className="text-text-muted text-xs">
                      You can request role updates through the User Roles Management section in Company Settings (accessible by admin/owner).
                    </p>
                  </>
                )}
              </div>
            </div>
            {showBackButton && (
              <div className="flex gap-3">
                <Button asChild>
                  <Link to={backUrl}>{backLabel}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/settings">Company Settings</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

