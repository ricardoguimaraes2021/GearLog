<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification->load('user');
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channel = new PrivateChannel('user.' . $this->notification->user_id);
        
        // Log apenas em desenvolvimento
        if (config('app.env') !== 'production') {
            \Illuminate\Support\Facades\Log::info('📡 Broadcasting NotificationCreated event', [
                'notification_id' => $this->notification->id,
                'user_id' => $this->notification->user_id,
                'channel' => 'user.' . $this->notification->user_id,
                'event_name' => 'notification.created',
                'notification_type' => $this->notification->type,
            ]);
        }
        
        return [$channel];
    }

    /**
     * The event's broadcast name.
     * 
     * Define o nome do evento como 'notification.created' para que o frontend
     * possa escutar usando .listen('notification.created', callback)
     */
    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'title' => $this->notification->title,
            'message' => $this->notification->message,
            'data' => $this->notification->data,
            'read_at' => $this->notification->read_at,
            'created_at' => $this->notification->created_at->toISOString(),
        ];
    }
}
