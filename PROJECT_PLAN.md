# GearLog - Project Plan & Architecture

## Project Overview
GearLog is a full-stack inventory management system for IT equipment, running entirely on localhost during development.

## Technology Stack

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI component library
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing
- **Dev Server**: http://localhost:5173

### Backend
- **Laravel 11** - PHP framework
- **PHP 8.3+** - Runtime
- **MySQL 8** - Database
- **Laravel Sanctum** - Authentication
- **Spatie Permissions** - Role-based access control
- **Laravel Excel** - Export functionality
- **Simple QR Code** - QR code generation
- **API Server**: http://localhost:8000
- **Storage**: `/storage/app/public`

## Project Structure

```
GearLog/
├── backend/                 # Laravel 11 application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── ProductController.php
│   │   │   │   │   ├── CategoryController.php
│   │   │   │   │   ├── MovementController.php
│   │   │   │   │   └── DashboardController.php
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   │   ├── Product.php
│   │   │   ├── Category.php
│   │   │   ├── Movement.php
│   │   │   └── User.php
│   │   ├── Services/
│   │   │   ├── QRCodeService.php
│   │   │   ├── ProductService.php
│   │   │   └── MovementService.php
│   │   └── Policies/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   │   └── api.php
│   ├── storage/
│   │   └── app/
│   │       └── public/
│   └── .env
│
└── frontend/                # React + Vite application
    ├── src/
    │   ├── components/
    │   │   ├── ui/          # shadcn/ui components
    │   │   ├── products/
    │   │   ├── categories/
    │   │   ├── movements/
    │   │   ├── dashboard/
    │   │   └── layout/
    │   ├── pages/
    │   │   ├── Products/
    │   │   ├── Categories/
    │   │   ├── Movements/
    │   │   ├── Dashboard/
    │   │   └── Auth/
    │   ├── stores/          # Zustand stores
    │   ├── services/        # API services
    │   ├── types/           # TypeScript types
    │   ├── utils/
    │   └── App.tsx
    ├── public/
    └── package.json
```

## Database Schema

### products
- id (bigint, primary)
- name (string)
- category_id (bigint, foreign)
- brand (string, nullable)
- model (string, nullable)
- serial_number (string, unique, nullable)
- status (enum: novo, usado, avariado, reparação, reservado)
- quantity (integer, default 0)
- value (decimal, nullable)
- purchase_date (date, nullable)
- specs (json, nullable)
- description (text, nullable)
- image_url (string, nullable)
- qr_code_url (string, nullable)
- timestamps

### categories
- id (bigint, primary)
- name (string, unique)
- slug (string, unique)
- timestamps

### movements
- id (bigint, primary)
- product_id (bigint, foreign)
- type (enum: entrada, saida, alocacao, devolucao)
- quantity (integer)
- assigned_to (string, nullable)
- notes (text, nullable)
- created_at
- updated_at

### users
- id (bigint, primary)
- name (string)
- email (string, unique)
- password (string, hashed)
- timestamps

### model_has_permissions (Spatie)
### model_has_roles (Spatie)
### roles (Spatie)
### permissions (Spatie)

## API Endpoints

### Authentication
- `POST /api/v1/login` - User login
- `POST /api/v1/logout` - User logout
- `GET /api/v1/user` - Get current user

### Products
- `GET /api/v1/products` - List products (with filters)
- `GET /api/v1/products/{id}` - Get product details
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Movements
- `POST /api/v1/products/{id}/movements` - Create movement
- `GET /api/v1/products/{id}/movements` - Get product movements

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Dashboard
- `GET /api/v1/dashboard` - Get dashboard KPIs

### Exports
- `GET /api/v1/products/export?format=pdf|excel|csv` - Export products

## Business Rules Implementation

1. **Serial Number Uniqueness**: Enforced at database level (unique constraint) and validated in ProductService
2. **Product Deletion**: Check quantity > 0 before deletion in ProductController
3. **Movement Logging**: All movements create entries in movements table via MovementService
4. **Stock Validation**: Validate stock >= 0 before any movement in MovementService
5. **Status Validation**: Prevent allocation of "avariado" products in MovementService
6. **Category Deletion**: Check if products exist before deletion in CategoryController
7. **Export Filters**: Apply current search/filter state to exports
8. **QR Code URL**: Generate URL pointing to frontend product detail page

## User Roles & Permissions

### Roles (Spatie)
- **admin** - Full access
- **gestor** - Manage products, categories, movements
- **tecnico** - View and create movements
- **consulta** - Read-only access

### Permissions
- `products.view`
- `products.create`
- `products.update`
- `products.delete`
- `categories.manage`
- `movements.create`
- `movements.view`
- `dashboard.view`
- `exports.generate`

## Features Implementation Checklist

### Backend
- [x] Project structure
- [ ] Laravel installation & configuration
- [ ] Database migrations
- [ ] Models with relationships
- [ ] API controllers
- [ ] Authentication (Sanctum)
- [ ] RBAC (Spatie Permissions)
- [ ] QR code generation service
- [ ] Image upload handling
- [ ] Movement service with business rules
- [ ] Dashboard controller
- [ ] Export functionality (PDF/Excel/CSV)
- [ ] Alerts system
- [ ] Activity logging

### Frontend
- [ ] Vite + React + TypeScript setup
- [ ] TailwindCSS configuration
- [ ] shadcn/ui installation
- [ ] Zustand stores setup
- [ ] Axios client with interceptors
- [ ] React Router setup
- [ ] Authentication pages
- [ ] Dashboard page with KPIs
- [ ] Products CRUD interface
- [ ] Categories management
- [ ] Movements interface
- [ ] QR code display & scanning
- [ ] Search & filters
- [ ] Export buttons
- [ ] Alerts display
- [ ] Responsive design

## Development Workflow

1. **Backend First**: Set up Laravel, migrations, models, controllers
2. **Authentication**: Implement Sanctum auth and Spatie permissions
3. **Core APIs**: Products, Categories, Movements
4. **Frontend Setup**: Vite, React, TypeScript, TailwindCSS, shadcn/ui
5. **State Management**: Zustand stores for auth, products, categories
6. **UI Components**: Build reusable components
7. **Pages**: Implement all pages with API integration
8. **Polish**: Alerts, exports, QR codes, responsive design

## Local Development Setup

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Next Steps
1. Initialize Laravel backend
2. Set up database migrations
3. Create models and relationships
4. Implement API controllers
5. Set up authentication
6. Initialize React frontend
7. Build UI components
8. Integrate frontend with backend APIs

