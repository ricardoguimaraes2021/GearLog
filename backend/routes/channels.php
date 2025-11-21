<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Only register channels if broadcasting is enabled
if (config('broadcasting.default') !== 'log') {
    Broadcast::channel('user.{userId}', function ($user, $userId) {
        try {
            // Verifica se o utilizador existe
            if (!$user || !$user->id) {
                if (config('app.env') !== 'production') {
                    \Illuminate\Support\Facades\Log::error('Broadcasting channel authorization failed: user is null or has no ID');
                }
                return false;
            }
            
            // Verifica se o utilizador é o dono do canal
            // Esta é a verificação principal - o utilizador só pode subscrever ao seu próprio canal
            $authenticatedUserId = (int) $user->id;
            $requestedUserId = (int) $userId;
            
            if ($authenticatedUserId !== $requestedUserId) {
                if (config('app.env') !== 'production') {
                    \Illuminate\Support\Facades\Log::warning('Broadcasting channel authorization denied: user ID mismatch', [
                        'authenticated_user_id' => $authenticatedUserId,
                        'requested_channel_user_id' => $requestedUserId,
                    ]);
                }
                return false;
            }
            
            // Se chegou aqui, é o próprio utilizador tentando subscrever ao seu canal
            // Permitir acesso
            if (config('app.env') !== 'production') {
                \Illuminate\Support\Facades\Log::info('Broadcasting channel authorization granted', [
                    'user_id' => $authenticatedUserId,
                    'channel' => "user.{$requestedUserId}",
                ]);
            }
            
            return true;
            
        } catch (\Exception $e) {
            // Sempre logar erros, mas apenas detalhes em desenvolvimento
            $logData = ['error' => $e->getMessage()];
            if (config('app.env') !== 'production') {
                $logData['trace'] = $e->getTraceAsString();
            }
            \Illuminate\Support\Facades\Log::error('Broadcasting channel authorization exception', $logData);
            return false;
        }
    });
}

