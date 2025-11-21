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
        ?array $data = null,
        ?int $companyId = null
    ): Notification {
        // Garantir que temos um objeto User
        $userModel = $user instanceof User ? $user : User::withoutGlobalScopes()->find($user);
        
        if (!$userModel) {
            Log::error("Cannot create notification: User not found", ['user_id' => $user]);
            throw new \Exception("User not found");
        }
        
        // Determinar company_id: usar o fornecido, ou o do utilizador, ou null para Super Admin
        $finalCompanyId = $companyId ?? $userModel->company_id;
        
        $notification = Notification::withoutGlobalScopes()->create([
            'user_id' => $userModel->id,
            'company_id' => $finalCompanyId, // Definir explicitamente
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Broadcast the notification (tentar broadcast, mas não falhar se houver erro)
        try {
            if (config('app.env') !== 'production') {
                Log::info('🚀 Dispatching NotificationCreated event', [
                    'notification_id' => $notification->id,
                    'user_id' => $userModel->id,
                    'channel' => 'user.' . $userModel->id,
                ]);
            }
            
            event(new \App\Events\NotificationCreated($notification));
        } catch (\Exception $e) {
            // Log do erro mas não falhar - a notificação já foi criada na BD
            Log::error('Failed to broadcast notification', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
            ]);
        }

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
     * Notify users by role (apenas utilizadores da mesma empresa)
     */
    public function notifyByRole(
        string $role,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?int $companyId = null
    ): void {
        // Se não especificada, usar a empresa do utilizador autenticado
        if (!$companyId && auth()->check() && auth()->user()->company_id) {
            $companyId = auth()->user()->company_id;
        }
        
        // Se ainda não temos company_id, não podemos notificar
        if (!$companyId) {
            Log::warning("Cannot notify by role: No company_id available", [
                'role' => $role,
                'type' => $type
            ]);
            return;
        }
        
        // Buscar utilizadores com o role, mas apenas da mesma empresa
        $users = User::withoutGlobalScopes()
            ->role($role)
            ->where('company_id', $companyId)
            ->get();
            
        $this->notifyUsers($users->all(), $type, $title, $message, $data);
    }
    
    /**
     * Notify users by role in a specific company
     */
    public function notifyByRoleInCompany(
        int $companyId,
        string $role,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        $this->notifyByRole($role, $type, $title, $message, $data, $companyId);
    }

    /**
     * Notify users who can handle tickets (based on TicketPolicy)
     * This includes: admin, gestor (manager), tecnico (technician)
     */
    public function notifyTicketHandlers(
        int $companyId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        // Buscar utilizadores que podem ver/gerir tickets (baseado no TicketPolicy)
        $users = User::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'gestor', 'tecnico']);
            })
            ->get();
            
        $this->notifyUsers($users->all(), $type, $title, $message, $data);
    }

    /**
     * Notify all users in a company
     */
    public function notifyAllInCompany(
        int $companyId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        $users = User::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->get();
            
        $this->notifyUsers($users->all(), $type, $title, $message, $data);
    }

    /**
     * Notify all users in multiple companies
     */
    public function notifyAllInCompanies(
        array $companyIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        foreach ($companyIds as $companyId) {
            $this->notifyAllInCompany($companyId, $type, $title, $message, $data);
        }
    }

    /**
     * Notify all users across all companies (Super Admin only)
     */
    public function notifyAllUsers(
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        $users = User::withoutGlobalScopes()
            ->whereNotNull('company_id')
            ->get();
            
        $this->notifyUsers($users->all(), $type, $title, $message, $data);
    }
}

