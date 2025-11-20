<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If user is not authenticated, let auth middleware handle it
        if (!$user) {
            return $next($request);
        }

        // Check if user has a company
        if (!$user->company_id) {
            return response()->json([
                'error' => 'User is not associated with a company. Please complete onboarding.',
            ], 403);
        }

        // Check if company exists and is active
        $company = $user->company;
        if (!$company) {
            return response()->json([
                'error' => 'Company not found.',
            ], 404);
        }

        // Check if company is suspended
        if ($company->isSuspended()) {
            return response()->json([
                'error' => 'Your company account has been suspended. Please contact support.',
            ], 403);
        }

        // Check if company is active
        if (!$company->is_active) {
            return response()->json([
                'error' => 'Your company account is inactive. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
