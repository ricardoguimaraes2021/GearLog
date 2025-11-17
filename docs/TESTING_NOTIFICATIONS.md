# Testing Notifications Guide

## 🧪 How to Test Notifications

### Option 1: Using the Test Endpoint (Easiest)

1. **Login to the application**
2. **Open browser console** (F12)
3. **Run this command:**
   ```javascript
   fetch('http://localhost:8000/api/v1/notifications/test', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
       'Content-Type': 'application/json',
       'Accept': 'application/json'
     }
   })
   .then(r => r.json())
   .then(data => {
     console.log('Test notification created:', data);
     // Refresh the page or click the notification bell
   });
   ```

4. **Click the notification bell** in the top navigation bar
5. **You should see the test notification**

### Option 2: Create a Real Notification (Ticket)

1. **Create a new ticket:**
   - Go to Tickets → New Ticket
   - Fill in the form and submit
   - Admin/Manager users will receive a notification

2. **Assign a ticket:**
   - Open any ticket
   - Assign it to a user
   - The assigned user will receive a notification

3. **Add a comment to a ticket:**
   - Open a ticket
   - Add a comment
   - Relevant users will receive notifications

### Option 3: Test Product Notifications

1. **Mark a product as damaged:**
   - Go to Products
   - Open a product
   - Change status to "Damaged"
   - Admin/Manager will receive a notification

2. **Create a product with low stock:**
   - Create a new product with quantity = 1
   - Admin/Manager will receive a low stock notification

### Option 4: Test via API Directly

Using curl or Postman:

```bash
# Get your auth token first (from localStorage or login response)
TOKEN="your_auth_token_here"

# Create test notification
curl -X POST http://localhost:8000/api/v1/notifications/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

## 📱 Viewing Notifications

### Without Real-time (Current Setup)

1. **Click the notification bell** in the top navigation
2. **Notifications will load from the database**
3. **Refresh the page** to see new notifications

### With Real-time (After Configuring Pusher)

1. **Configure Pusher** (see `NOTIFICATIONS_SETUP.md`)
2. **Notifications will appear automatically** without refreshing
3. **Toast notifications will pop up** for new notifications

## 🔔 Notification Types You Can Test

### Ticket Notifications
- ✅ **ticket_created** - Create a new ticket
- ✅ **ticket_assigned** - Assign a ticket to a user
- ✅ **ticket_commented** - Add a comment to a ticket
- ✅ **ticket_status_changed** - Change ticket status
- ✅ **sla_violated** - Wait for SLA deadline to pass (or manually trigger)

### Inventory Notifications
- ✅ **low_stock** - Create/update product with quantity ≤ 1
- ✅ **product_damaged** - Mark product as damaged

## 🧪 Quick Test Script

Save this as `test-notification.js` and run in browser console:

```javascript
// Test notification creation
async function testNotification() {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.error('Not logged in!');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/notifications/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('✅ Test notification created:', data);
    console.log('🔔 Click the notification bell to see it!');
    
    // Optionally refresh notifications
    window.location.reload();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testNotification();
```

## 📊 Check Notification Count

In browser console:

```javascript
// Check unread count
fetch('http://localhost:8000/api/v1/notifications/unread-count', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Unread notifications:', data.count));
```

## 🎯 Expected Behavior

### Without Pusher (Current)
- ✅ Notifications are **saved in database**
- ✅ Can **view notifications** by clicking the bell
- ✅ **Badge shows unread count**
- ❌ **No real-time updates** (need to refresh)
- ❌ **No toast notifications**

### With Pusher (After Configuration)
- ✅ All of the above, PLUS:
- ✅ **Real-time updates** (no refresh needed)
- ✅ **Toast notifications** appear automatically
- ✅ **Instant badge updates**

## 🐛 Troubleshooting

### Notifications not appearing?

1. **Check if notification was created:**
   ```bash
   # In backend directory
   php artisan tinker
   >>> \App\Models\Notification::count()
   >>> \App\Models\Notification::latest()->first()
   ```

2. **Check user ID:**
   - Make sure you're logged in as the correct user
   - Notifications are user-specific

3. **Check API response:**
   - Open browser DevTools → Network tab
   - Check `/api/v1/notifications` endpoint
   - Verify response contains notifications

### Test endpoint not working?

1. **Check authentication:**
   - Make sure you're logged in
   - Token is valid

2. **Check route:**
   ```bash
   php artisan route:list | grep notifications
   ```

3. **Check permissions:**
   - Test endpoint should work for any authenticated user

## 📝 Next Steps

1. **Test basic notifications** using the test endpoint
2. **Test real notifications** by creating tickets/products
3. **Configure Pusher** (optional) for real-time notifications
4. **Verify all notification types** work correctly

