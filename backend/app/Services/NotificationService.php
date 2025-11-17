<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification and broadcast it
     */
    public function createNotification(
        User|int $user,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): Notification {
        $userId = $user instanceof User ? $user->id : $user;

        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Broadcast the notification
        event(new \App\Events\NotificationCreated($notification));

        return $notification;
    }

    /**
     * Notify multiple users
     */
    public function notifyUsers(
        array $users,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        foreach ($users as $user) {
            $this->createNotification($user, $type, $title, $message, $data);
        }
    }

    /**
     * Notify users by role
     */
    public function notifyByRole(
        string $role,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        $users = User::role($role)->get();
        $this->notifyUsers($users->all(), $type, $title, $message, $data);
    }
}

