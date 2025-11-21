<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "GearLog API",
    description: "IT Equipment Inventory Management System API"
)]
#[OA\Server(
    url: "http://localhost:8000/api/v1",
    description: "Local development server"
)]
#[OA\SecurityScheme(
    securityScheme: "bearerAuth",
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT"
)]
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Handle exceptions and return standardized error responses
     */
    protected function handleException(\Exception $e, string $defaultMessage = 'An error occurred'): \Illuminate\Http\JsonResponse
    {
        \Log::error('Controller exception', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
        ]);

        // Handle business rule exceptions
        if ($e instanceof \App\Exceptions\BusinessRuleException) {
            return response()->json([
                'error' => $e->getUserMessage(),
                'context' => $e->getContext(),
            ], 400);
        }

        // Handle validation exceptions
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        // Handle authentication exceptions
        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'You must be authenticated to access this resource.',
            ], 401);
        }

        // Handle authorization exceptions
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        // Generic error response
        return response()->json([
            'error' => $defaultMessage,
            'message' => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}

