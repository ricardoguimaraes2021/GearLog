import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Bell, Check, X, Ticket, Package, AlertTriangle, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Notifications() {
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

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    if (type.includes('sla')) return <AlertTriangle className="h-5 w-5 text-danger dark:text-danger" />;
    if (type.includes('ticket')) return <Ticket className="h-5 w-5 text-accent-primary dark:text-accent-primary" />;
    if (type.includes('stock')) return <Package className="h-5 w-5 text-warning dark:text-warning" />;
    if (type.includes('damaged')) return <AlertTriangle className="h-5 w-5 text-danger dark:text-danger" />;
    return <Bell className="h-5 w-5 text-text-muted" />;
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

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.read_at) return false;
    if (filter === 'read' && !n.read_at) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const notificationTypes = Array.from(new Set(notifications.map((n) => n.type)));

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await testNotification();
            }}
            variant="outline"
          >
            🧪 Test
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <span className="text-sm font-medium text-text-primary">Filter:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Read
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-border bg-background dark:bg-surface text-text-primary px-3 py-2 text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
              >
                <option value="all">All Types</option>
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-lg font-medium text-text-primary mb-2">No notifications</p>
            <p className="text-text-secondary">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const link = getNotificationLink(notification);
            const isUnread = !notification.read_at;
            const NotificationContent = (
              <Card className={isUnread ? 'border-accent-primary border-2' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${isUnread ? 'text-text-primary' : 'text-text-primary'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-text-secondary mt-1">{notification.message}</p>
                        </div>
                        {isUnread && (
                          <span className="h-3 w-3 rounded-full bg-accent-primary dark:bg-accent-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

      {/* Pagination */}
      {notifications.length >= 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-text-secondary">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={notifications.length < 20}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

