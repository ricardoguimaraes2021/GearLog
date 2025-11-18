# Migration Order and Dependencies

This document outlines the correct order of migrations and their dependencies to ensure data integrity.

## Migration Execution Order

Migrations are executed in chronological order based on their timestamp prefix. The following is the correct order:

### Batch 1: Core Tables (2024_01_01_*)
1. **2024_01_01_000001_create_categories_table.php**
   - Creates `categories` table
   - No dependencies
   - Must run first (products depend on it)

2. **2024_01_01_000002_create_products_table.php**
   - Creates `products` table
   - **Depends on:** `categories` (foreign key: `category_id`)
   - Must run after categories

3. **2024_01_01_000003_create_movements_table.php**
   - Creates `movements` table
   - **Depends on:** `products` (foreign key: `product_id`)
   - Must run after products

4. **2024_01_01_000004_create_activity_log_table.php**
   - Creates `activity_log` table
   - No dependencies
   - Can run independently

### Batch 2: Cache and Permissions (2025_11_15_*)
5. **2025_11_15_182935_create_cache_table.php**
   - Creates `cache` table
   - No dependencies
   - Can run independently

6. **2025_11_15_182927_create_permission_tables.php**
   - Creates Spatie permissions tables
   - No dependencies
   - Can run independently

### Batch 3: Users and Authentication (2025_11_15_*)
7. **2025_11_15_182959_create_users_table.php**
   - Creates `users` table
   - **Depends on:** Permission tables (uses Spatie)
   - Should run after permissions

8. **2025_11_17_144415_create_personal_access_tokens_table.php**
   - Creates `personal_access_tokens` table (Laravel Sanctum)
   - **Depends on:** `users` (foreign key: `tokenable_id`)
   - Must run after users

### Batch 4: Product/Movement Updates (2025_11_17_*)
9. **2025_11_17_173834_update_product_status_and_movement_type_enums_to_english.php**
   - Updates enum values from Portuguese to English
   - **Depends on:** `products`, `movements` tables
   - Must run after products and movements are created
   - **Important:** This migration modifies existing data

### Batch 5: Tickets System (2025_11_17_1751*)
10. **2025_11_17_175113_create_tickets_table.php**
    - Creates `tickets` table
    - **Depends on:** `users` (foreign keys: `opened_by`, `assigned_to`), `products` (foreign key: `product_id`)
    - Must run after users and products

11. **2025_11_17_175114_create_ticket_comments_table.php**
    - Creates `ticket_comments` table
    - **Depends on:** `tickets` (foreign key: `ticket_id`), `users` (foreign key: `user_id`)
    - Must run after tickets and users

12. **2025_11_17_175115_create_ticket_logs_table.php**
    - Creates `ticket_logs` table
    - **Depends on:** `tickets` (foreign key: `ticket_id`), `users` (foreign key: `user_id`)
    - Must run after tickets and users

13. **2025_11_17_184300_add_sla_fields_to_tickets_table.php**
    - Adds SLA fields to `tickets` table
    - **Depends on:** `tickets` table
    - Must run after tickets table is created

### Batch 6: Notifications (2025_11_17_1910*)
14. **2025_11_17_191045_create_notifications_table.php**
    - Creates `notifications` table
    - **Depends on:** `users` (foreign key: `notifiable_id`)
    - Must run after users

### Batch 7: Departments and Employees (2025_11_17_2006*)
15. **2025_11_17_200641_create_departments_table.php**
    - Creates `departments` table
    - No dependencies
    - Can run independently

16. **2025_11_17_200642_create_employees_table.php**
    - Creates `employees` table
    - **Depends on:** `departments` (foreign key: `department_id`)
    - Must run after departments

17. **2025_11_17_200644_create_asset_assignments_table.php**
    - Creates `asset_assignments` table
    - **Depends on:** `products` (foreign key: `product_id`), `employees` (foreign key: `employee_id`), `users` (foreign keys: `assigned_by`, `returned_by`)
    - Must run after products, employees, and users

18. **2025_11_17_200645_create_employee_logs_table.php**
    - Creates `employee_logs` table
    - **Depends on:** `employees` (foreign key: `employee_id`), `users` (foreign key: `user_id`)
    - Must run after employees and users

19. **2025_11_17_200804_add_manager_employee_id_to_departments_table.php**
    - Adds `manager_employee_id` foreign key to `departments`
    - **Depends on:** `departments`, `employees` tables
    - Must run after both departments and employees are created

20. **2025_11_17_210144_add_employee_id_to_tickets_table.php**
    - Adds `employee_id` foreign key to `tickets`
    - **Depends on:** `tickets`, `employees` tables
    - Must run after both tickets and employees are created

## Critical Dependencies Graph

```
categories (1)
  └── products (2)
       ├── movements (3)
       ├── tickets (10)
       │    ├── ticket_comments (11)
       │    ├── ticket_logs (12)
       │    └── add_sla_fields (13)
       └── asset_assignments (17)

users (7)
  ├── personal_access_tokens (8)
  ├── tickets (10)
  ├── ticket_comments (11)
  ├── ticket_logs (12)
  ├── notifications (14)
  ├── asset_assignments (17)
  └── employee_logs (18)

departments (15)
  └── employees (16)
       ├── add_manager_to_departments (19)
       ├── asset_assignments (17)
       └── add_employee_to_tickets (20)

products (2)
  └── update_enums_to_english (9)

movements (3)
  └── update_enums_to_english (9)
```

## Migration Issues and Fixes

### Issue 1: Enum Update Migration
The migration `2025_11_17_173834_update_product_status_and_movement_type_enums_to_english.php` modifies existing data. If you have existing data with Portuguese enum values, this migration will convert them to English.

**Fix:** Ensure this migration runs after all data is seeded (if using seeders with Portuguese values).

### Issue 2: Foreign Key Constraints
Some migrations add foreign keys that depend on tables created in later migrations. Laravel handles this by executing migrations in chronological order, but be aware of:
- `departments.manager_employee_id` depends on `employees` (migration 19)
- `tickets.employee_id` depends on `employees` (migration 20)

These are correctly handled as separate migrations that add foreign keys after both tables exist.

## Recommended Migration Flow

1. **Fresh Installation:**
   ```bash
   php artisan migrate:fresh
   php artisan db:seed
   ```

2. **With Existing Data:**
   ```bash
   php artisan migrate
   # If enum values need updating, ensure data is compatible
   ```

3. **Rollback (if needed):**
   ```bash
   php artisan migrate:rollback --step=1
   ```

## Verification

After running migrations, verify:
- All foreign keys are properly created
- Enum values match expected values (English)
- All indexes are created
- No orphaned records exist

## Notes

- All migrations use proper foreign key constraints with appropriate `onDelete` actions
- Indexes are created for frequently queried columns
- Timestamps are automatically added by Laravel
- The enum update migration uses raw SQL to safely convert enum values

