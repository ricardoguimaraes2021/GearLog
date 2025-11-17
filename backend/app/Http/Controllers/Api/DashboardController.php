<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movement;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\Employee;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::count();
        $totalValue = Product::sum(DB::raw('quantity * COALESCE(value, 0)'));
        $damagedProducts = Product::where('status', 'damaged')->count();
        $lowStockProducts = Product::where('quantity', '<=', 1)->count();

        // Products by category
        $productsByCategory = Product::select('categories.name', DB::raw('count(*) as count'))
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->groupBy('categories.id', 'categories.name')
            ->get();

        // Recent movements
        $recentMovements = Movement::with(['product.category'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($movement) {
                return [
                    'id' => $movement->id,
                    'type' => 'movement',
                    'product' => $movement->product ? [
                        'id' => $movement->product->id,
                        'name' => $movement->product->name,
                        'category' => $movement->product->category ? $movement->product->category->name : null,
                    ] : null,
                    'movement_type' => $movement->type,
                    'quantity' => $movement->quantity,
                    'assigned_to' => $movement->assigned_to,
                    'created_at' => $movement->created_at,
                ];
            });

        // Recent assignments (checkout and checkin)
        $recentAssignments = AssetAssignment::with(['product.category', 'employee', 'assignedBy', 'returnedBy'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'type' => $assignment->returned_at ? 'assignment_return' : 'assignment_checkout',
                    'product' => $assignment->product ? [
                        'id' => $assignment->product->id,
                        'name' => $assignment->product->name,
                        'category' => $assignment->product->category ? $assignment->product->category->name : null,
                    ] : null,
                    'employee' => $assignment->employee ? [
                        'id' => $assignment->employee->id,
                        'name' => $assignment->employee->name,
                        'employee_code' => $assignment->employee->employee_code,
                    ] : null,
                    'assigned_by' => $assignment->assignedBy ? $assignment->assignedBy->name : null,
                    'returned_by' => $assignment->returnedBy ? $assignment->returnedBy->name : null,
                    'assigned_at' => $assignment->assigned_at,
                    'returned_at' => $assignment->returned_at,
                    'created_at' => $assignment->created_at,
                ];
            });

        // Combine and sort by created_at (most recent first)
        $recentActivities = collect()
            ->merge($recentMovements->map(function ($movement) {
                return array_merge($movement, ['timestamp' => $movement['created_at']]);
            }))
            ->merge($recentAssignments->map(function ($assignment) {
                // Use assigned_at for checkout, returned_at for return, or created_at as fallback
                $timestamp = $assignment['returned_at'] ?? $assignment['assigned_at'] ?? $assignment['created_at'];
                return array_merge($assignment, ['timestamp' => $timestamp]);
            }))
            ->sortByDesc('timestamp')
            ->take(10)
            ->values()
            ->all();

        // Products without movement in last 30 days
        $inactiveProductsQuery = Product::whereDoesntHave('movements', function ($query) {
            $query->where('created_at', '>=', now()->subDays(30));
        });
        $inactiveProducts = $inactiveProductsQuery->count();
        $inactiveProductsList = $inactiveProductsQuery->with('category')
            ->select('id', 'name', 'category_id', 'quantity', 'status')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category ? $product->category->name : null,
                    'quantity' => $product->quantity,
                    'status' => $product->status,
                ];
            });

        // Low stock products list
        $lowStockProductsList = Product::where('quantity', '<=', 1)
            ->with('category')
            ->select('id', 'name', 'category_id', 'quantity', 'status')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category ? $product->category->name : null,
                    'quantity' => $product->quantity,
                    'status' => $product->status,
                ];
            });

        // Damaged products list
        $damagedProductsList = Product::where('status', 'damaged')
            ->with('category')
            ->select('id', 'name', 'category_id', 'quantity', 'status')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category ? $product->category->name : null,
                    'quantity' => $product->quantity,
                    'status' => $product->status,
                ];
            });

        // Ticket metrics
        $totalTickets = Ticket::count();
        $openTickets = Ticket::where('status', 'open')->count();
        $inProgressTickets = Ticket::where('status', 'in_progress')->count();
        $criticalTickets = Ticket::where('priority', 'critical')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();
        $unassignedTickets = Ticket::whereNull('assigned_to')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        // Recent tickets (last 5)
        $recentTickets = Ticket::with(['product', 'openedBy', 'assignedTo'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'product' => $ticket->product ? $ticket->product->name : null,
                    'opened_by' => $ticket->openedBy ? $ticket->openedBy->name : null,
                    'assigned_to' => $ticket->assignedTo ? $ticket->assignedTo->name : null,
                    'created_at' => $ticket->created_at,
                ];
            });

        // Employee metrics
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'active')->count();
        $totalAssignments = AssetAssignment::whereNull('returned_at')->count();

        // Alerts
        $alerts = [
            'low_stock' => $lowStockProducts,
            'low_stock_products' => $lowStockProductsList,
            'damaged' => $damagedProducts,
            'damaged_products' => $damagedProductsList,
            'inactive' => $inactiveProducts,
            'inactive_products' => $inactiveProductsList,
        ];

        return response()->json([
            'kpis' => [
                'total_products' => $totalProducts,
                'total_value' => (float) $totalValue,
                'damaged_products' => $damagedProducts,
                'low_stock_products' => $lowStockProducts,
            ],
            'tickets' => [
                'total_tickets' => $totalTickets,
                'open_tickets' => $openTickets,
                'in_progress_tickets' => $inProgressTickets,
                'critical_tickets' => $criticalTickets,
                'unassigned_tickets' => $unassignedTickets,
            ],
            'employees' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'total_assignments' => $totalAssignments,
            ],
            'products_by_category' => $productsByCategory,
            'recent_movements' => $recentActivities,
            'recent_tickets' => $recentTickets,
            'alerts' => $alerts,
        ]);
    }
}

