<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class LogBroadcastingAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Apenas processa rotas de broadcasting
        if (!$request->is('broadcasting/auth') && !$request->is('broadcasting/*')) {
            return $next($request);
        }

        // Para rotas de broadcasting, autentica e regista tudo
        if (config('app.env') !== 'production') {
            Log::info('Broadcasting auth request', [
                'path' => $request->path(),
                'user_authenticated_before' => auth()->check(),
                'user_id_before' => auth()->id(),
            ]);
        }
        
        // Tenta autenticar manualmente antes de passar para o próximo middleware
        $this->authenticateManually($request);
        
        // Se não está autenticado, retorna 403
        if (!auth()->check()) {
            Log::error('Broadcasting auth: User not authenticated', [
                'path' => $request->path(),
                'token_present' => $request->bearerToken() !== null,
            ]);
            
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'You must be authenticated to access broadcasting channels.',
            ], 403);
        }

        try {
            $response = $next($request);
            return $response;
        } catch (\Exception $e) {
            // Sempre logar erros, mas apenas detalhes em desenvolvimento
            if ($request->is('broadcasting/auth') || $request->is('broadcasting/*')) {
                $logData = [
                    'error' => $e->getMessage(),
                    'error_class' => get_class($e),
                ];
                
                if (config('app.env') !== 'production') {
                    $logData['file'] = $e->getFile();
                    $logData['line'] = $e->getLine();
                    $logData['trace'] = $e->getTraceAsString();
                }
                
                Log::error('Broadcasting auth exception', $logData);
            }
            throw $e;
        }
    }

    /**
     * Tenta autenticar manualmente o utilizador usando Sanctum
     */
    protected function authenticateManually(Request $request): void
    {
        // Tenta obter o token do header Authorization
        $token = $request->bearerToken();
        
        if (!$token) {
            // Tenta obter do header Authorization diretamente
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
            }
        }

        if ($token) {
            try {
                // Tenta encontrar o token na base de dados
                $accessToken = PersonalAccessToken::findToken($token);
                
                if ($accessToken) {
                    $user = $accessToken->tokenable;
                    if ($user) {
                        // Autentica o utilizador no guard sanctum (necessário para auth:sanctum)
                        auth('sanctum')->setUser($user);
                        // Também autentica no guard web (necessário para broadcasting)
                        auth('web')->setUser($user);
                        
                        if (config('app.env') !== 'production') {
                            Log::info('Broadcasting auth: Manual authentication successful', [
                                'user_id' => $user->id,
                                'user_email' => $user->email,
                            ]);
                        }
                    } else {
                    if (config('app.env') !== 'production') {
                        Log::warning('Broadcasting auth: Token found but user is null', [
                            'token_id' => $accessToken->id,
                        ]);
                    }
                }
            } else {
                if (config('app.env') !== 'production') {
                    Log::warning('Broadcasting auth: Token not found in database');
                }
            }
        } catch (\Exception $e) {
            // Sempre logar erros de autenticação, mas apenas detalhes em desenvolvimento
            $logData = ['error' => $e->getMessage()];
            if (config('app.env') !== 'production') {
                $logData['error_class'] = get_class($e);
            }
            Log::error('Broadcasting auth: Error during manual authentication', $logData);
        }
    } else {
        if (config('app.env') !== 'production') {
            Log::warning('Broadcasting auth: No token found in request');
        }
        }
    }
}

