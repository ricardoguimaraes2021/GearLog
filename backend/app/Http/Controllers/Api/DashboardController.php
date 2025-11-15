<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movement;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::count();
        $totalValue = Product::sum(DB::raw('quantity * COALESCE(value, 0)'));
        $damagedProducts = Product::where('status', 'avariado')->count();
        $lowStockProducts = Product::where('quantity', '<', 1)->count();

        // Products by category
        $productsByCategory = Product::select('categories.name', DB::raw('count(*) as count'))
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->groupBy('categories.id', 'categories.name')
            ->get();

        // Recent movements
        $recentMovements = Movement::with(['product.category'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Products without movement in last 30 days
        $inactiveProducts = Product::whereDoesntHave('movements', function ($query) {
            $query->where('created_at', '>=', now()->subDays(30));
        })->count();

        // Alerts
        $alerts = [
            'low_stock' => $lowStockProducts,
            'damaged' => $damagedProducts,
            'inactive' => $inactiveProducts,
        ];

        return response()->json([
            'kpis' => [
                'total_products' => $totalProducts,
                'total_value' => (float) $totalValue,
                'damaged_products' => $damagedProducts,
                'low_stock_products' => $lowStockProducts,
            ],
            'products_by_category' => $productsByCategory,
            'recent_movements' => $recentMovements,
            'alerts' => $alerts,
        ]);
    }
}

