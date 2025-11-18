<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Notifications', description: 'Notification management endpoints')]
class NotificationController extends Controller
{
    #[OA\Get(
        path: '/api/v1/notifications',
        summary: 'Get all notifications for the authenticated user',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'read', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['true', 'false'])),
            new OA\Parameter(name: 'type', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of notifications',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
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

    #[OA\Get(
        path: '/api/v1/notifications/unread-count',
        summary: 'Get unread notifications count',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Unread count',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'count', type: 'integer'),
                    ]
                )
            ),
        ]
    )]
    public function unreadCount()
    {
        $count = Auth::user()->unreadNotifications()->count();
        return response()->json(['count' => $count]);
    }

    #[OA\Post(
        path: '/api/v1/notifications/{id}/read',
        summary: 'Mark notification as read',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Notification marked as read'),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json($notification);
    }

    #[OA\Post(
        path: '/api/v1/notifications/read-all',
        summary: 'Mark all notifications as read',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'All notifications marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
        ]
    )]
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    #[OA\Delete(
        path: '/api/v1/notifications/{id}',
        summary: 'Delete notification',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notification deleted',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                    ]
                )
            ),
            new OA\Response(response: 403, description: 'Unauthorized'),
        ]
    )]
    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    #[OA\Post(
        path: '/api/v1/notifications/test',
        summary: 'Create a test notification (for testing purposes)',
        tags: ['Notifications'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 201,
                description: 'Test notification created',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
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
