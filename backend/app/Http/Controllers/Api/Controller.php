<?php

namespace App\Http\Controllers\Api;

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
}

