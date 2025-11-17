<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $query = Auth::user()->notifications();

        // Filter by read/unread
        if ($request->has('read')) {
            if ($request->read === 'true') {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $perPage = $request->get('per_page', 20);
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount()
    {
        $count = Auth::user()->unreadNotifications()->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json($notification);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete notification
     */
    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Create a test notification (for testing purposes)
     */
    public function test()
    {
        $user = Auth::user();
        
        $notification = \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => '🧪 Test Notification',
            'message' => 'This is a test notification to verify the notification system is working correctly.',
            'data' => [
                'test' => true,
                'timestamp' => now()->toISOString(),
            ],
        ]);

        // Try to broadcast if Pusher is configured
        try {
            event(new \App\Events\NotificationCreated($notification));
        } catch (\Exception $e) {
            // Ignore if Pusher is not configured
        }

        return response()->json([
            'message' => 'Test notification created successfully',
            'notification' => $notification,
        ], 201);
    }
}
