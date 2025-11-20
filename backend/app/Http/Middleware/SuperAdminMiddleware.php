<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated.',
            ], 401);
        }

        // Check if user is super admin
        // Super admin is identified by email in config/app.php (from SUPER_ADMIN_EMAILS env var)
        $superAdminEmails = config('app.super_admin_emails', ['admin@gearlog.local']);

        $isSuperAdmin = in_array($user->email, array_map('trim', $superAdminEmails));

        if (!$isSuperAdmin) {
            return response()->json([
                'error' => 'Unauthorized. Super admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
