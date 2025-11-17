# Real-time Notifications Setup Guide

## 📋 Overview

This guide explains how to set up and configure the real-time notifications system in GearLog.

## 🔧 Backend Configuration

### 1. Install Dependencies

The Pusher PHP Server package is already installed. If you need to reinstall:

```bash
cd backend
composer require pusher/pusher-php-server
```

### 2. Configure Broadcasting

Add the following to your `.env` file:

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
3. Copy the credentials from the "App Keys" section

### 3. Run Migrations

```bash
cd backend
php artisan migrate
```

This will create the `notifications` table.

### 4. Configure Broadcasting Auth

The broadcasting authentication route is already configured in `routes/web.php`. Make sure your `.env` has:

```env
FRONTEND_URL=http://localhost:5173
```

## 🎨 Frontend Configuration

### 1. Install Dependencies

Dependencies are already installed. If needed:

```bash
cd frontend
npm install laravel-echo pusher-js date-fns
```

### 2. Configure Environment Variables

Add to your `frontend/.env` or `frontend/.env.local`:

```env
VITE_PUSHER_APP_KEY=your_app_key
VITE_PUSHER_APP_CLUSTER=mt1
VITE_API_URL=http://localhost:8000/api/v1
```

**Note:** Use the same `PUSHER_APP_KEY` and `PUSHER_APP_CLUSTER` from your backend `.env`.

## 🚀 How It Works

### Event Flow

1. **Event Triggered**: When an action occurs (e.g., ticket created), an event is fired
2. **Notification Created**: The event handler creates a notification in the database
3. **Broadcast**: The notification is broadcast via WebSocket to the user's private channel
4. **Frontend Receives**: Laravel Echo receives the notification in real-time
5. **UI Updates**: The notification bell badge updates and a toast appears

### Notification Types

- **ticket_created**: New ticket created
- **ticket_assigned**: Ticket assigned to a user
- **ticket_commented**: New comment on a ticket
- **ticket_status_changed**: Ticket status changed
- **sla_violated**: SLA violation detected
- **low_stock**: Product stock is low
- **product_damaged**: Product marked as damaged

## 📱 Features

### Notification Bell
- Located in the top navigation bar
- Shows unread count badge
- Click to open dropdown with recent notifications

### Notification Dropdown
- Shows last 20 notifications
- Unread notifications highlighted
- Click notification to navigate to related item
- "Mark all as read" button
- Delete individual notifications

### Toast Notifications
- Automatic pop-up for new notifications
- Auto-dismiss after 5 seconds
- Action button to navigate to related item

## 🔔 Testing Notifications

### Test Ticket Notifications

1. Create a new ticket → Admin/Manager should receive notification
2. Assign a ticket → Assigned user should receive notification
3. Add a comment → Relevant users should receive notification
4. Change ticket status → Stakeholders should receive notification

### Test Inventory Notifications

1. Mark a product as damaged → Admin/Manager should receive notification
2. Create a product with quantity ≤ 1 → Low stock notification (if implemented)

## 🐛 Troubleshooting

### Notifications Not Appearing

1. **Check Pusher Configuration**
   - Verify `.env` has correct Pusher credentials
   - Check that `BROADCAST_DRIVER=pusher`

2. **Check Frontend Configuration**
   - Verify `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_APP_CLUSTER` are set
   - Check browser console for errors

3. **Check WebSocket Connection**
   - Open browser DevTools → Network → WS tab
   - Should see WebSocket connection to Pusher
   - Check for connection errors

4. **Check Authentication**
   - User must be logged in
   - Token must be valid
   - Broadcasting auth endpoint must be accessible

### Events Not Firing

1. **Check Event Registration**
   - Events are auto-discovered by Laravel
   - Check `app/Providers/EventServiceProvider.php`

2. **Check Event Handlers**
   - Events should have `handle()` method
   - Check Laravel logs for errors

3. **Check Database**
   - Ensure `notifications` table exists
   - Check if notifications are being created in database

### Echo Not Connecting

1. **Check Token**
   - Token must be valid and not expired
   - Check localStorage for `auth_token`

2. **Check User ID**
   - User ID must be available in localStorage as `auth_user`
   - Check browser console for errors

3. **Check CORS**
   - Ensure CORS is configured correctly
   - Check `config/cors.php`

## 📝 Environment Variables Summary

### Backend (.env)
```env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
```

### Frontend (.env or .env.local)
```env
VITE_PUSHER_APP_KEY=your_app_key
VITE_PUSHER_APP_CLUSTER=mt1
VITE_API_URL=http://localhost:8000/api/v1
```

## 🎯 Next Steps

1. **Configure Pusher**: Sign up and get credentials
2. **Update .env files**: Add Pusher credentials
3. **Test**: Create a ticket and verify notifications work
4. **Customize**: Adjust notification messages and types as needed

## 📚 Additional Resources

- [Laravel Broadcasting Documentation](https://laravel.com/docs/broadcasting)
- [Pusher Documentation](https://pusher.com/docs)
- [Laravel Echo Documentation](https://laravel.com/docs/broadcasting#client-side-installation)

