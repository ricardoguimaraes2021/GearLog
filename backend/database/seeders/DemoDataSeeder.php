<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Movement;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\AssetAssignment;
use App\Models\User;
use App\Services\SlaService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    protected $slaService;

    public function __construct()
    {
        $this->slaService = new SlaService();
    }

    public function run(): void
    {
        // Get demo company
        $company = \App\Models\Company::where('name', 'GearLog Demo Company')->first();
        if (!$company) {
            $this->command->warn('Demo company not found. Please run DatabaseSeeder first.');
            return;
        }

        // Clear existing demo data (optional - comment out if you want to keep existing data)
        // Product::truncate();
        // Movement::truncate();
        // Ticket::truncate();
        // AssetAssignment::truncate();

        // Use withoutGlobalScopes to avoid TenantScope interference during seeding
        $categories = Category::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->get();
        $users = User::withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->get();
        $employees = Employee::withoutGlobalScopes()
            ->where('status', 'active')
            ->where('company_id', $company->id)
            ->get();
        $adminUser = User::withoutGlobalScopes()
            ->where('email', 'admin@gearlog.local')
            ->where('company_id', $company->id)
            ->first();

        if ($categories->isEmpty() || $users->isEmpty() || $employees->isEmpty()) {
            $this->command->warn('Please run DatabaseSeeder first to create categories, users, and employees.');
            return;
        }

        // Create Products with realistic data
        $products = $this->createProducts($categories, $company);
        
        // Create Movements
        $this->createMovements($products, $users, $company);
        
        // Create Asset Assignments
        $this->createAssetAssignments($products, $employees, $users, $company);
        
        // Create Tickets with various statuses
        $this->createTickets($products, $employees, $users, $company);
        
        $this->command->info('Demo data seeded successfully!');
    }

    protected function createProducts($categories, $company): array
    {
        $products = [];
        
        $productData = [
            // Laptops
            [
                'name' => 'Dell Latitude 5520',
                'category' => 'Laptops',
                'brand' => 'Dell',
                'model' => 'Latitude 5520',
                'status' => 'new',
                'quantity' => 15,
                'value' => 1299.99,
                'specs' => ['CPU' => 'Intel Core i7-1185G7', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'Screen' => '15.6" FHD'],
            ],
            [
                'name' => 'HP EliteBook 840 G8',
                'category' => 'Laptops',
                'brand' => 'HP',
                'model' => 'EliteBook 840 G8',
                'status' => 'used',
                'quantity' => 8,
                'value' => 1199.99,
                'specs' => ['CPU' => 'Intel Core i5-1135G7', 'RAM' => '8GB', 'Storage' => '256GB SSD', 'Screen' => '14" FHD'],
            ],
            [
                'name' => 'MacBook Pro 14" M1',
                'category' => 'Laptops',
                'brand' => 'Apple',
                'model' => 'MacBook Pro 14"',
                'status' => 'new',
                'quantity' => 5,
                'value' => 1999.99,
                'specs' => ['CPU' => 'Apple M1 Pro', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'Screen' => '14.2" Liquid Retina'],
            ],
            [
                'name' => 'Lenovo ThinkPad X1 Carbon',
                'category' => 'Laptops',
                'brand' => 'Lenovo',
                'model' => 'ThinkPad X1 Carbon Gen 9',
                'status' => 'used',
                'quantity' => 12,
                'value' => 1499.99,
                'specs' => ['CPU' => 'Intel Core i7-1165G7', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'Screen' => '14" WQHD'],
            ],
            [
                'name' => 'Dell XPS 13',
                'category' => 'Laptops',
                'brand' => 'Dell',
                'model' => 'XPS 13 9310',
                'status' => 'damaged',
                'quantity' => 2,
                'value' => 1299.99,
                'specs' => ['CPU' => 'Intel Core i7-1165G7', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'Screen' => '13.4" FHD+'],
            ],
            [
                'name' => 'HP ProBook 450 G8',
                'category' => 'Laptops',
                'brand' => 'HP',
                'model' => 'ProBook 450 G8',
                'status' => 'repair',
                'quantity' => 1,
                'value' => 899.99,
                'specs' => ['CPU' => 'Intel Core i5-1135G7', 'RAM' => '8GB', 'Storage' => '256GB SSD', 'Screen' => '15.6" FHD'],
            ],
            [
                'name' => 'ASUS ZenBook 14',
                'category' => 'Laptops',
                'brand' => 'ASUS',
                'model' => 'ZenBook 14 UX425',
                'status' => 'reserved',
                'quantity' => 3,
                'value' => 1099.99,
                'specs' => ['CPU' => 'Intel Core i7-1165G7', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'Screen' => '14" FHD'],
            ],
            
            // Desktops
            [
                'name' => 'Dell OptiPlex 7090',
                'category' => 'Desktops',
                'brand' => 'Dell',
                'model' => 'OptiPlex 7090',
                'status' => 'new',
                'quantity' => 20,
                'value' => 899.99,
                'specs' => ['CPU' => 'Intel Core i5-11500', 'RAM' => '8GB', 'Storage' => '256GB SSD', 'GPU' => 'Integrated'],
            ],
            [
                'name' => 'HP EliteDesk 800 G6',
                'category' => 'Desktops',
                'brand' => 'HP',
                'model' => 'EliteDesk 800 G6',
                'status' => 'used',
                'quantity' => 10,
                'value' => 799.99,
                'specs' => ['CPU' => 'Intel Core i5-10500', 'RAM' => '8GB', 'Storage' => '256GB SSD', 'GPU' => 'Integrated'],
            ],
            [
                'name' => 'Lenovo ThinkCentre M90a',
                'category' => 'Desktops',
                'brand' => 'Lenovo',
                'model' => 'ThinkCentre M90a',
                'status' => 'new',
                'quantity' => 15,
                'value' => 1099.99,
                'specs' => ['CPU' => 'Intel Core i7-11700', 'RAM' => '16GB', 'Storage' => '512GB SSD', 'GPU' => 'Integrated'],
            ],
            
            // Monitors
            [
                'name' => 'Dell UltraSharp U2720Q',
                'category' => 'Monitors',
                'brand' => 'Dell',
                'model' => 'U2720Q',
                'status' => 'new',
                'quantity' => 25,
                'value' => 549.99,
                'specs' => ['Size' => '27"', 'Resolution' => '4K UHD', 'Panel' => 'IPS', 'Connectivity' => 'USB-C, HDMI, DisplayPort'],
            ],
            [
                'name' => 'HP EliteDisplay E243',
                'category' => 'Monitors',
                'brand' => 'HP',
                'model' => 'EliteDisplay E243',
                'status' => 'used',
                'quantity' => 18,
                'value' => 249.99,
                'specs' => ['Size' => '23.8"', 'Resolution' => 'FHD', 'Panel' => 'IPS', 'Connectivity' => 'VGA, HDMI, DisplayPort'],
            ],
            [
                'name' => 'LG 27UN850-W',
                'category' => 'Monitors',
                'brand' => 'LG',
                'model' => '27UN850-W',
                'status' => 'new',
                'quantity' => 12,
                'value' => 399.99,
                'specs' => ['Size' => '27"', 'Resolution' => '4K UHD', 'Panel' => 'IPS', 'Connectivity' => 'USB-C, HDMI, DisplayPort'],
            ],
            [
                'name' => 'Samsung Odyssey G7',
                'category' => 'Monitors',
                'brand' => 'Samsung',
                'model' => 'Odyssey G7',
                'status' => 'damaged',
                'quantity' => 1,
                'value' => 699.99,
                'specs' => ['Size' => '32"', 'Resolution' => 'QHD', 'Panel' => 'VA', 'Refresh Rate' => '240Hz'],
            ],
            
            // Keyboards
            [
                'name' => 'Logitech MX Keys',
                'category' => 'Keyboards',
                'brand' => 'Logitech',
                'model' => 'MX Keys',
                'status' => 'new',
                'quantity' => 30,
                'value' => 99.99,
                'specs' => ['Type' => 'Wireless', 'Layout' => 'QWERTY', 'Backlight' => 'Yes', 'Battery' => 'Rechargeable'],
            ],
            [
                'name' => 'Microsoft Surface Keyboard',
                'category' => 'Keyboards',
                'brand' => 'Microsoft',
                'model' => 'Surface Keyboard',
                'status' => 'used',
                'quantity' => 15,
                'value' => 79.99,
                'specs' => ['Type' => 'Wireless', 'Layout' => 'QWERTY', 'Backlight' => 'No'],
            ],
            [
                'name' => 'Corsair K70 RGB',
                'category' => 'Keyboards',
                'brand' => 'Corsair',
                'model' => 'K70 RGB',
                'status' => 'new',
                'quantity' => 8,
                'value' => 149.99,
                'specs' => ['Type' => 'Mechanical', 'Layout' => 'QWERTY', 'Backlight' => 'RGB', 'Switches' => 'Cherry MX'],
            ],
            
            // Mice
            [
                'name' => 'Logitech MX Master 3',
                'category' => 'Mice',
                'brand' => 'Logitech',
                'model' => 'MX Master 3',
                'status' => 'new',
                'quantity' => 35,
                'value' => 99.99,
                'specs' => ['Type' => 'Wireless', 'DPI' => '4000', 'Buttons' => '7', 'Battery' => 'Rechargeable'],
            ],
            [
                'name' => 'Microsoft Surface Mouse',
                'category' => 'Mice',
                'brand' => 'Microsoft',
                'model' => 'Surface Mouse',
                'status' => 'used',
                'quantity' => 20,
                'value' => 49.99,
                'specs' => ['Type' => 'Wireless', 'DPI' => '1000', 'Buttons' => '3'],
            ],
            [
                'name' => 'Razer DeathAdder V2',
                'category' => 'Mice',
                'brand' => 'Razer',
                'model' => 'DeathAdder V2',
                'status' => 'new',
                'quantity' => 10,
                'value' => 69.99,
                'specs' => ['Type' => 'Wired', 'DPI' => '20000', 'Buttons' => '8', 'RGB' => 'Yes'],
            ],
            
            // Networking
            [
                'name' => 'Cisco Catalyst 2960-X',
                'category' => 'Networking',
                'brand' => 'Cisco',
                'model' => 'Catalyst 2960-X',
                'status' => 'new',
                'quantity' => 5,
                'value' => 1299.99,
                'specs' => ['Ports' => '48', 'Speed' => '1Gbps', 'Type' => 'Managed Switch', 'PoE' => 'Yes'],
            ],
            [
                'name' => 'Ubiquiti UniFi AP AC Pro',
                'category' => 'Networking',
                'brand' => 'Ubiquiti',
                'model' => 'UniFi AP AC Pro',
                'status' => 'used',
                'quantity' => 8,
                'value' => 149.99,
                'specs' => ['Type' => 'Access Point', 'Speed' => '1300 Mbps', 'PoE' => 'Yes', 'Range' => '400ft'],
            ],
            [
                'name' => 'Netgear Nighthawk AX8',
                'category' => 'Networking',
                'brand' => 'Netgear',
                'model' => 'Nighthawk AX8',
                'status' => 'new',
                'quantity' => 3,
                'value' => 399.99,
                'specs' => ['Type' => 'Router', 'Speed' => '6Gbps', 'Bands' => 'Tri-Band', 'MU-MIMO' => 'Yes'],
            ],
            
            // Storage
            [
                'name' => 'Samsung 980 PRO 1TB',
                'category' => 'Storage',
                'brand' => 'Samsung',
                'model' => '980 PRO',
                'status' => 'new',
                'quantity' => 20,
                'value' => 199.99,
                'specs' => ['Type' => 'NVMe SSD', 'Capacity' => '1TB', 'Speed' => '7000 MB/s', 'Interface' => 'PCIe 4.0'],
            ],
            [
                'name' => 'Western Digital My Passport 2TB',
                'category' => 'Storage',
                'brand' => 'Western Digital',
                'model' => 'My Passport',
                'status' => 'new',
                'quantity' => 15,
                'value' => 79.99,
                'specs' => ['Type' => 'External HDD', 'Capacity' => '2TB', 'Interface' => 'USB 3.0', 'Portable' => 'Yes'],
            ],
            [
                'name' => 'Seagate IronWolf 4TB',
                'category' => 'Storage',
                'brand' => 'Seagate',
                'model' => 'IronWolf',
                'status' => 'used',
                'quantity' => 10,
                'value' => 129.99,
                'specs' => ['Type' => 'Internal HDD', 'Capacity' => '4TB', 'RPM' => '5900', 'Use' => 'NAS'],
            ],
        ];

        foreach ($productData as $data) {
            $category = $categories->firstWhere('name', $data['category']);
            if (!$category) {
                continue;
            }

            $purchaseDate = Carbon::now()->subMonths(rand(1, 24))->subDays(rand(1, 30));
            
            $product = Product::create([
                'name' => $data['name'],
                'category_id' => $category->id,
                'company_id' => $company->id,
                'brand' => $data['brand'],
                'model' => $data['model'],
                'serial_number' => $this->generateSerialNumber($data['brand']),
                'status' => $data['status'],
                'quantity' => $data['quantity'],
                'value' => $data['value'],
                'purchase_date' => $purchaseDate,
                'specs' => $data['specs'],
                'description' => "High-quality {$data['brand']} {$data['model']} for professional use.",
            ]);

            $products[] = $product;
        }

        // Create some products with low stock (quantity <= 1)
        $lowStockProducts = [
            [
                'name' => 'Dell Latitude 7420',
                'category' => 'Laptops',
                'brand' => 'Dell',
                'model' => 'Latitude 7420',
                'status' => 'new',
                'quantity' => 1,
                'value' => 1399.99,
            ],
            [
                'name' => 'HP EliteDisplay E27',
                'category' => 'Monitors',
                'brand' => 'HP',
                'model' => 'EliteDisplay E27',
                'status' => 'new',
                'quantity' => 0,
                'value' => 299.99,
            ],
        ];

        foreach ($lowStockProducts as $data) {
            $category = $categories->firstWhere('name', $data['category']);
            if ($category) {
                $products[] = Product::create([
                    'name' => $data['name'],
                    'category_id' => $category->id,
                    'company_id' => $company->id,
                    'brand' => $data['brand'],
                    'model' => $data['model'],
                    'serial_number' => $this->generateSerialNumber($data['brand']),
                    'status' => $data['status'],
                    'quantity' => $data['quantity'],
                    'value' => $data['value'],
                    'purchase_date' => Carbon::now()->subMonths(rand(1, 12)),
                    'description' => "Professional {$data['brand']} {$data['model']}.",
                ]);
            }
        }

        return $products;
    }

    protected function createMovements($products, $users, $company): void
    {
        $movementTypes = ['entry', 'exit', 'allocation', 'return'];
        $user = $users->first();

        foreach ($products as $product) {
            // Create initial entry movement
            Movement::create([
                'product_id' => $product->id,
                'company_id' => $company->id,
                'type' => 'entry',
                'quantity' => $product->quantity,
                'assigned_to' => null,
                'notes' => 'Initial stock entry',
                'created_at' => $product->purchase_date ?? Carbon::now()->subMonths(rand(1, 12)),
            ]);

            // Create some random movements for variety
            if (rand(0, 1)) {
                $movementCount = rand(1, 3);
                for ($i = 0; $i < $movementCount; $i++) {
                    $type = $movementTypes[array_rand($movementTypes)];
                    $quantity = rand(1, min(5, $product->quantity));
                    $createdAt = Carbon::now()->subDays(rand(1, 90));

                    Movement::create([
                        'product_id' => $product->id,
                        'company_id' => $company->id,
                        'type' => $type,
                        'quantity' => $quantity,
                        'assigned_to' => $type === 'allocation' ? 'Department A' : null,
                        'notes' => "Movement: {$type}",
                        'created_at' => $createdAt,
                    ]);
                }
            }
        }
    }

    protected function createAssetAssignments($products, $employees, $users, $company): void
    {
        $productsCollection = collect($products);
        $assignableProducts = $productsCollection->filter(function ($product) {
            return in_array($product->status, ['new', 'used']) && $product->quantity > 0;
        })->take(15);

        $adminUser = $users->first();

        foreach ($assignableProducts as $product) {
            $employee = $employees->random();
            $assignedAt = Carbon::now()->subDays(rand(1, 180));

            // Some assignments are returned, some are still active
            $isReturned = rand(0, 1);
            // Ensure returned_at is never in the future
            if ($isReturned) {
                $daysSinceAssignment = Carbon::now()->diffInDays($assignedAt);
                // Return date should be between assigned_at and now
                $daysToAdd = min(rand(30, 120), $daysSinceAssignment);
                $returnedAt = $assignedAt->copy()->addDays($daysToAdd);
                // Ensure it's not in the future
                if ($returnedAt->isFuture()) {
                    $returnedAt = Carbon::now()->subDays(rand(1, 7));
                }
            } else {
                $returnedAt = null;
            }

            AssetAssignment::create([
                'product_id' => $product->id,
                'employee_id' => $employee->id,
                'company_id' => $company->id,
                'assigned_by' => $adminUser->id,
                'returned_by' => $isReturned ? $adminUser->id : null,
                'assigned_at' => $assignedAt,
                'returned_at' => $returnedAt,
                'condition_on_return' => $isReturned ? 'Good condition' : null,
                'notes' => "Assigned to {$employee->name} for work use.",
            ]);
        }
    }

    protected function createTickets($products, $employees, $users, $company): void
    {
        $priorities = ['low', 'medium', 'high', 'critical'];
        $statuses = ['open', 'in_progress', 'waiting_parts', 'resolved', 'closed'];
        $types = ['damage', 'maintenance', 'update', 'audit', 'other'];
        $adminUser = $users->first();
        
        // Get all technician users (including any created by migrations)
        $techUsers = \App\Models\User::withoutGlobalScopes()
            ->role('tecnico')
            ->where('company_id', $company->id)
            ->get();
        if ($techUsers->isEmpty()) {
            $techUsers = collect([$users->where('email', 'tecnico@gearlog.local')->first() ?? $users->first()]);
        }

        $ticketData = [
            // Critical tickets (open/in progress)
            [
                'title' => 'Server Room Cooling System Failure',
                'product' => null,
                'priority' => 'critical',
                'status' => 'open',
                'type' => 'damage',
                'description' => 'The cooling system in the server room has completely failed. Temperature is rising rapidly. Immediate attention required.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subHours(1),
            ],
            [
                'title' => 'Network Switch Port Malfunction',
                'product' => 'Cisco Catalyst 2960-X',
                'priority' => 'critical',
                'status' => 'in_progress',
                'type' => 'damage',
                'description' => 'Multiple ports on the main network switch are not responding. Affecting several departments.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subHours(3),
            ],
            
            // High priority tickets
            [
                'title' => 'Laptop Screen Cracked - Urgent Replacement Needed',
                'product' => 'Dell Latitude 5520',
                'priority' => 'high',
                'status' => 'in_progress',
                'type' => 'damage',
                'description' => 'Employee dropped laptop and screen is completely cracked. Needs immediate replacement for work continuity.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subHours(5),
            ],
            [
                'title' => 'Monitor Flickering Issue',
                'product' => 'Dell UltraSharp U2720Q',
                'priority' => 'high',
                'status' => 'open',
                'type' => 'maintenance',
                'description' => 'Monitor keeps flickering intermittently. Very distracting for daily work.',
                'assigned_to' => null,
                'created_at' => Carbon::now()->subHours(8),
            ],
            
            // Medium priority tickets
            [
                'title' => 'Keyboard Keys Not Responding',
                'product' => 'Logitech MX Keys',
                'priority' => 'medium',
                'status' => 'in_progress',
                'type' => 'maintenance',
                'description' => 'Several keys on the keyboard are not responding properly. Needs cleaning or replacement.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subDays(1),
            ],
            [
                'title' => 'Software Update Required',
                'product' => 'HP EliteBook 840 G8',
                'priority' => 'medium',
                'status' => 'open',
                'type' => 'update',
                'description' => 'Laptop needs OS and security updates. Please schedule maintenance window.',
                'assigned_to' => null,
                'created_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Mouse Scroll Wheel Malfunction',
                'product' => 'Logitech MX Master 3',
                'priority' => 'medium',
                'status' => 'waiting_parts',
                'type' => 'maintenance',
                'description' => 'Scroll wheel is not working smoothly. Waiting for replacement part.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subDays(3),
            ],
            
            // Low priority tickets
            [
                'title' => 'Routine Maintenance Check',
                'product' => 'Dell OptiPlex 7090',
                'priority' => 'low',
                'status' => 'open',
                'type' => 'maintenance',
                'description' => 'Scheduled routine maintenance check for desktop computers.',
                'assigned_to' => null,
                'created_at' => Carbon::now()->subDays(5),
            ],
            [
                'title' => 'Asset Audit Request',
                'product' => null,
                'priority' => 'low',
                'status' => 'open',
                'type' => 'audit',
                'description' => 'Quarterly asset audit required. Need to verify all equipment locations.',
                'assigned_to' => null,
                'created_at' => Carbon::now()->subDays(7),
            ],
            
            // Resolved tickets
            [
                'title' => 'Printer Connection Issue - RESOLVED',
                'product' => null,
                'priority' => 'medium',
                'status' => 'resolved',
                'type' => 'other',
                'description' => 'Network printer was not connecting. Issue resolved by updating drivers.',
                'resolution' => 'Updated printer drivers and reconfigured network settings. Printer is now working correctly.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subDays(10),
                'first_response_at' => Carbon::now()->subDays(10)->addHours(2),
            ],
            [
                'title' => 'Monitor Calibration - RESOLVED',
                'product' => 'HP EliteDisplay E243',
                'priority' => 'low',
                'status' => 'closed',
                'type' => 'maintenance',
                'description' => 'Monitor colors were not displaying correctly. Needed calibration.',
                'resolution' => 'Calibrated monitor using color calibration tool. Colors now accurate.',
                'assigned_to' => $techUsers->random()->id,
                'created_at' => Carbon::now()->subDays(15),
                'first_response_at' => Carbon::now()->subDays(15)->addHours(4),
            ],
        ];

        $productsCollection = collect($products);
        
        foreach ($ticketData as $data) {
            $product = null;
            if ($data['product']) {
                $product = $productsCollection->first(function ($p) use ($data) {
                    return str_contains($p->name, $data['product']);
                });
            }

            $createdAt = $data['created_at'] ?? Carbon::now()->subDays(rand(1, 30));
            
            // Calculate SLA deadlines - create a temporary ticket instance
            $tempTicket = new Ticket();
            $tempTicket->priority = $data['priority'];
            // Set created_at as Carbon instance for SLA calculation
            if ($createdAt instanceof Carbon) {
                $tempTicket->created_at = $createdAt;
            } else {
                $tempTicket->created_at = Carbon::parse($createdAt);
            }
            $deadlines = $this->slaService->calculateDeadlines($tempTicket);

            $ticket = Ticket::create([
                'title' => $data['title'],
                'product_id' => $product?->id,
                'employee_id' => $product ? $employees->random()->id : null,
                'company_id' => $company->id,
                'opened_by' => $adminUser->id,
                'assigned_to' => $data['assigned_to'] ?? null,
                'priority' => $data['priority'],
                'type' => $data['type'],
                'status' => $data['status'],
                'description' => $data['description'],
                'resolution' => $data['resolution'] ?? null,
                'first_response_deadline' => $deadlines['first_response_deadline'],
                'resolution_deadline' => $deadlines['resolution_deadline'],
                'first_response_at' => $data['first_response_at'] ?? null,
                'sla_violated' => false,
                'created_at' => $createdAt,
            ]);

            // Create some comments for active tickets
            if (in_array($ticket->status, ['open', 'in_progress', 'waiting_parts'])) {
                $commentCount = rand(0, 3);
                for ($i = 0; $i < $commentCount; $i++) {
                    TicketComment::create([
                        'ticket_id' => $ticket->id,
                        'user_id' => $users->random()->id,
                        'company_id' => $company->id,
                        'message' => "Update: " . ['Working on this issue', 'Waiting for parts', 'Need more information', 'Almost resolved'][rand(0, 3)],
                        'created_at' => $createdAt->copy()->addHours(rand(1, 24)),
                    ]);
                }
            }

            // Create some tickets with SLA violations (past deadline)
            if (rand(0, 1) && in_array($ticket->status, ['open', 'in_progress'])) {
                // Make some tickets violate SLA by setting created_at far in the past
                if (rand(0, 1)) {
                    $ticket->update([
                        'created_at' => Carbon::now()->subDays(rand(8, 15)),
                        'first_response_deadline' => Carbon::now()->subDays(rand(5, 10)),
                        'resolution_deadline' => Carbon::now()->subDays(rand(1, 5)),
                        'sla_violated' => true,
                    ]);
                }
            }
        }
    }

    protected function generateSerialNumber($brand): string
    {
        $prefix = strtoupper(substr($brand, 0, 3));
        return $prefix . '-' . str_pad((string) rand(100000, 999999), 6, '0', STR_PAD_LEFT) . '-' . str_pad((string) rand(100, 999), 3, '0', STR_PAD_LEFT);
    }
}

