# Real-time Notifications System

## Overview

GearLog includes a fully functional real-time notifications system using Laravel Broadcasting with Pusher. Notifications are delivered instantly to users via WebSocket connections.

## Status

✅ **Fully Implemented** - The notification system is complete and ready to use. It requires Pusher configuration to enable real-time delivery.

## Features

### Notification Types

- **Ticket Notifications**
  - `ticket_created` - New ticket created (notifies Admin/Manager)
  - `ticket_assigned` - Ticket assigned to user
  - `ticket_commented` - New comment on ticket
  - `ticket_status_changed` - Ticket status changed
  - `sla_violated` - SLA violation detected

- **Inventory Notifications**
  - `low_stock` - Product stock is low (≤ 1)
  - `product_damaged` - Product marked as damaged

### UI Components

- **Notification Bell** - Badge showing unread count in top navigation
- **Notification Dropdown** - Shows last 20 notifications with actions
- **Notifications Page** - Full feed with filters and pagination
- **Toast Notifications** - Automatic pop-ups for new notifications

## Setup

### 1. Backend Configuration

Add to `backend/.env`:
```env
BROADCAST_DRIVER=pusher

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

**To get Pusher credentials:**
1. Sign up at [pusher.com](https://pusher.com) (free tier available)
2. Create a new app
3. Copy credentials from "App Keys" section

### 2. Frontend Configuration

Add to `frontend/.env` or `frontend/.env.local`:
```env
VITE_PUSHER_APP_KEY=your_app_key
VITE_PUSHER_APP_CLUSTER=mt1
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Run Migrations

```bash
cd backend
php artisan migrate
```

## How It Works

### Event Flow

1. **Action Occurs** - User creates ticket, assigns ticket, etc.
2. **Event Fired** - Laravel event is dispatched
3. **Notification Created** - NotificationService creates database record
4. **Broadcast** - NotificationCreated event broadcasts via WebSocket
5. **Frontend Receives** - Laravel Echo receives notification in real-time
6. **UI Updates** - Badge updates and toast appears

### Without Pusher

- ✅ Notifications are saved in database
- ✅ Can view notifications by clicking bell
- ✅ Badge shows unread count
- ❌ No real-time updates (need to refresh)
- ❌ No toast notifications

### With Pusher

- ✅ All of the above, PLUS:
- ✅ Real-time updates (no refresh needed)
- ✅ Toast notifications appear automatically
- ✅ Instant badge updates

## Testing

### Test Endpoint

Use the test endpoint to verify notifications work:

```bash
curl -X POST http://localhost:8000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

Or in browser console:
```javascript
fetch('http://localhost:8000/api/v1/notifications/test', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
```

### Real-world Testing

1. **Create a ticket** → Admin/Manager receives notification
2. **Assign ticket** → Assigned user receives notification
3. **Add comment** → Relevant users receive notification
4. **Mark product as damaged** → Admin/Manager receives notification
5. **Create product with quantity 1** → Low stock notification

## Troubleshooting

### Notifications Not Appearing

1. **Check Pusher Configuration**
   - Verify `.env` has correct Pusher credentials
   - Check that `BROADCAST_DRIVER=pusher`

2. **Check Frontend Configuration**
   - Verify `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_APP_CLUSTER` are set
   - Check browser console for errors

3. **Check WebSocket Connection**
   - Open DevTools → Network → WS tab
   - Should see WebSocket connection to Pusher
   - Check for connection errors

4. **Check Authentication**
   - User must be logged in
   - Token must be valid
   - Broadcasting auth endpoint must be accessible

### Echo Not Connecting

1. **Check Token** - Token must be valid and not expired
2. **Check User ID** - User ID must be in localStorage as `auth_user`
3. **Check CORS** - Ensure CORS is configured correctly

## API Endpoints

- `GET /api/v1/notifications` - List notifications (paginated)
- `GET /api/v1/notifications/unread-count` - Get unread count
- `POST /api/v1/notifications/{id}/read` - Mark as read
- `POST /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/{id}` - Delete notification
- `POST /api/v1/notifications/test` - Create test notification

## Technical Details

### Broadcasting
- **Driver**: Pusher
- **Channels**: Private channels per user (`user.{userId}`)
- **Authentication**: Laravel Sanctum token

### Real-time Updates
- **Connection**: Laravel Echo with Pusher JS
- **Listener**: `notification.created` event
- **Auto-reconnect**: Handled by Pusher

### Database
- **Table**: `notifications`
- **Indexes**: user_id + read_at, type
- **Relations**: Belongs to User

## Future Enhancements

- Email notifications for critical alerts
- User notification preferences
- Sound alerts (optional)
- Browser push notifications
- Notification grouping
- Scheduled summaries

## Documentation

- **Backend Events**: `backend/app/Events/`
- **Notification Service**: `backend/app/Services/NotificationService.php`
- **Frontend Store**: `frontend/src/stores/notificationStore.ts`
- **Echo Service**: `frontend/src/services/echo.ts`
- **Components**: `frontend/src/components/notifications/`

