<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // HSTS (HTTP Strict Transport Security) - apenas em produção com HTTPS
        if (config('app.env') === 'production' && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Content Security Policy básico (pode ser ajustado conforme necessário)
        // Nota: CSP pode quebrar algumas funcionalidades se muito restritivo
        // Descomenta e ajusta se necessário:
        /*
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com; " .
               "style-src 'self' 'unsafe-inline'; " .
               "img-src 'self' data: https:; " .
               "font-src 'self' data:; " .
               "connect-src 'self' https://api-*.pusher.com wss://ws-*.pusher.com; " .
               "frame-ancestors 'none';";
        $response->headers->set('Content-Security-Policy', $csp);
        */

        // Remove informações do servidor (opcional, mas recomendado)
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}

