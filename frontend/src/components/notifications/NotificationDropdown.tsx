import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Bell, Check, X, Ticket, Package, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    if (type.includes('sla')) return <AlertTriangle className="h-4 w-4 text-danger dark:text-danger" />;
    if (type.includes('ticket')) return <Ticket className="h-4 w-4 text-accent-primary dark:text-accent-primary" />;
    if (type.includes('stock')) return <Package className="h-4 w-4 text-warning dark:text-warning" />;
    if (type.includes('damaged')) return <AlertTriangle className="h-4 w-4 text-danger dark:text-danger" />;
    return <Bell className="h-4 w-4 text-text-muted" />;
  };

  const getNotificationLink = (notification: Notification): string | null => {
    if (notification.data?.ticket_id) {
      return `/tickets/${notification.data.ticket_id}`;
    }
    if (notification.data?.product_id) {
      return `/inventory/products/${notification.data.product_id}`;
    }
    return null;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <Card className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden z-50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border">
        <CardTitle className="text-lg font-semibold text-text-primary">Notifications</CardTitle>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-center text-text-secondary">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <Bell className="h-12 w-12 mx-auto mb-2 text-text-muted opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const isUnread = !notification.read_at;
              const NotificationContent = (
                <div
                  className={`p-4 border-b border-border hover:bg-surface-alt dark:hover:bg-surface-alt transition-colors cursor-pointer ${
                    isUnread ? 'bg-accent-primary/10 dark:bg-accent-primary/20' : 'bg-background dark:bg-surface'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${isUnread ? 'text-text-primary' : 'text-text-primary'}`}>
                          {notification.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-accent-primary dark:bg-accent-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );

              return link ? (
                <Link key={notification.id} to={link}>
                  {NotificationContent}
                </Link>
              ) : (
                <div key={notification.id}>{NotificationContent}</div>
              );
            })}
          </div>
        )}
        <div className="p-2 border-t border-border space-y-2">
          {notifications.length > 0 && (
            <Link to="/notifications" className="block">
              <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
                View all notifications
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await testNotification();
            }}
          >
            🧪 Test Notification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

