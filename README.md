# GearLog - IT Equipment Inventory Management System

**Version 1.0.0** - First Stable Release 🎉

A comprehensive, full-stack inventory management system designed specifically for IT teams to track, manage, and optimize their equipment efficiently.

## 🖼️ Gallery

Check out the [**Live Gallery**](https://gearlogallery.vercel.app/) to see screenshots and features of the application.

## 🎯 Overview

GearLog is a modern, feature-rich inventory management solution that combines powerful backend capabilities with an intuitive, responsive frontend interface. Built with Laravel 11 and React 18, it provides everything you need to manage IT equipment from a single, unified platform.

## ✨ Key Features

### 📦 Product Management
- **Complete CRUD Operations** - Create, read, update, and delete products with ease
- **Detailed Product Information** - Track brand, model, serial numbers, specifications, and purchase dates
- **Image Upload & Optimization** - Upload product images with automatic optimization
- **QR Code Generation** - Automatically generate QR codes for each product
- **Public Product View** - Shareable public pages accessible via QR code scanning
- **Status Management** - Track product status (new, used, damaged, repair, reserved)
- **Purchase Date Tracking** - Monitor when products were purchased with validation

### 📊 Dashboard & Analytics
- **Real-time KPIs** - Monitor total products, total value, damaged products, and low stock
- **Visual Analytics** - Products by category breakdown
- **Recent Activity** - Track recent movements and ticket activity
- **Smart Alerts** - Expandable alerts showing specific products with:
  - Low stock warnings
  - Damaged products
  - Inactive products (no movement in 30+ days)
- **Ticket Metrics Integration** - View ticket KPIs directly on main dashboard

### 🎫 Ticket System
- **Complete Ticket Management** - Create, assign, and track support tickets
- **Employee Integration** - Link tickets to employees for better tracking
- **SLA (Service Level Agreement)** - Automated SLA tracking with:
  - Configurable response and resolution times by priority
  - Real-time SLA violation detection
  - SLA at-risk warnings (80% time elapsed)
  - Compliance rate tracking
  - Historical compliance trend charts
- **Ticket Types** - Support for damage, maintenance, update, audit, and other ticket types
- **Priority Levels** - Low, medium, high, and critical priorities
- **Status Workflow** - Open → In Progress → Waiting Parts → Resolved → Closed
- **File Attachments** - Attach images, PDFs, DOC, DOCX, and TXT files to tickets and comments
- **Comments & Collaboration** - Add comments with attachments for team communication
- **Assignment System** - Assign tickets to technicians (users) and link to employees
- **Activity Logs** - Complete audit trail of all ticket actions
- **Ticket Dashboard** - Dedicated dashboard with:
  - Ticket KPIs (total, open, in progress, critical, unassigned)
  - Tickets by status, priority, type, technician
  - Most reported products and categories
  - Recent and urgent tickets
  - SLA compliance metrics and trends

### 👥 Employee Management
- **Employee Directory** - Complete employee management with personal and corporate information
- **Employee Profiles** - View employee details, assigned assets, associated tickets, and activity logs
- **Status Management** - Track active and inactive employees
- **Department Assignment** - Link employees to departments
- **Employee Export** - Export employee data to CSV, Excel, or PDF formats
- **Activity Logs** - Complete audit trail of all employee-related actions

### 🏢 Department Management
- **Department Directory** - Create and manage organizational departments
- **Department Profiles** - View department details, employees, assigned assets, and active tickets
- **Manager Assignment** - Assign department managers
- **Cost Center Tracking** - Track cost centers for departments
- **Usage Analytics** - View asset usage and ticket statistics by department
- **Department Dashboard** - Monitor total employees, assigned assets, total value, and active tickets

### 📦 Asset Assignment
- **Checkout System** - Assign assets to employees with validation
- **Check-in System** - Return assets with condition tracking
- **Assignment History** - Complete history of all asset assignments
- **Status Validation** - Only assignable products can be assigned (new, used, repair status)
- **Employee Validation** - Only active employees can receive assets
- **Automatic Status Updates** - Product status automatically updated on assignment/return
- **Recent Activities** - Asset assignments displayed in dashboard recent activities

### 📈 Movement Tracking
- **Movement Types** - Entry, exit, allocation, and return movements
- **Stock Validation** - Prevent negative stock with real-time validation
- **Assigned To Tracking** - Track who products are assigned to
- **Movement History** - Complete history grouped by purchase date
- **Notes & Documentation** - Add notes to movements for context
- **Recent Activities** - Combined view of movements and asset assignments

### 🔍 Search & Filtering
- **Advanced Search** - Search products by name, description, or serial number
- **Multi-filter Support** - Filter by category, status, and custom criteria
- **Real-time Results** - Instant search results as you type

### 📤 Export & Reporting
- **Multiple Formats** - Export to CSV, Excel (XLSX), or PDF
- **Product Exports** - Export product inventory with all details
- **Employee Exports** - Export employee directory with department information
- **Filtered Exports** - Export only filtered/search results
- **Professional Reports** - Formatted PDF reports with company branding

### 🔐 Security & Access Control
- **Role-Based Access Control (RBAC)** - Granular permissions with Spatie Permissions
- **User Roles**:
  - **Admin** - Full system access
  - **Manager (Gestor)** - Manage products, categories, movements, and tickets
  - **Technician (Tecnico)** - View and create movements, manage assigned tickets
  - **Read-only (Consulta)** - View-only access
- **Role Management** - Company owners and admins can assign roles to users
- **Ticket Permissions** - Fine-grained permissions for ticket operations:
  - Only assigned users can change ticket status
  - Ticket creators can always view and edit their tickets
  - Admin and Manager have full ticket management access
- **Laravel Sanctum Authentication** - Secure API authentication
- **CSRF Protection** - Built-in CSRF token protection
- **API Rate Limiting** - Protect against abuse with configurable rate limits
- **Tenant Isolation** - Strict data separation between companies

### 🏢 Multi-Tenancy (SaaS)
- **Company Isolation** - Complete data separation between tenants
- **Public Registration** - Self-service user registration
- **Onboarding Flow** - Company setup after registration
- **Plan Management** - FREE, PRO, and ENTERPRISE plans with limits
- **Plan Limits** - Configurable limits for users, products, and tickets
- **Company Suspension** - Suspend/activate tenant accounts
- **Usage Statistics** - Track resource usage per company

### 👨‍💼 Super Admin Panel
- **Complete Admin Console** - Dedicated interface accessible only at `/admin` route
- **Global Dashboard** - System-wide metrics with filtering capabilities
  - Filter by company, role, plan type, and date range
  - Real-time system health monitoring
  - Daily and monthly active users tracking
- **Company Management** - List, view, and manage all companies
  - View company details with user roles overview
  - Usage analytics per company
  - Plan management (upgrade/downgrade)
  - Company suspension/activation
  - Activity logs (tickets, products, users)
- **Global User Management** - View all users across all companies
  - Search by name or email
  - View user roles and company associations
  - User impersonation for support
- **Analytics & Reports** - System-wide analytics
  - Total companies, users, products, and tickets
  - Plan distribution statistics
  - Growth metrics and trends
- **Security & Audit Logs** - View security events and audit trails
- **System Settings** - Configure global system settings
- **Isolated Navigation** - Super admin never sees regular user interface
- **Profile Management** - Dedicated profile page without regular layout

### 🎨 User Experience
- **Modern UI** - Built with shadcn/ui components and TailwindCSS
- **Responsive Design** - Fully responsive, works on desktop, tablet, and mobile
- **Mobile Navigation** - Hamburger menu for mobile devices
- **Toast Notifications** - User-friendly toast notifications (no browser alerts)
- **Loading States** - Skeleton loaders for better perceived performance
- **Error Handling** - Comprehensive error boundaries and user-friendly error messages
- **Form Validation** - Client-side validation with Zod schemas

### 📱 Public Access
- **QR Code Scanning** - Scan QR codes to view product details without login
- **Public Product Pages** - Shareable product information pages
- **Mobile-Friendly** - Optimized for mobile QR code scanning

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 11
- **Language**: PHP 8.3+
- **Database**: MySQL 8
- **Authentication**: Laravel Sanctum
- **Authorization**: Spatie Permissions (RBAC)
- **File Storage**: Local filesystem with public storage
- **Image Processing**: Intervention Image
- **QR Code Generation**: Simple QR Code
- **Export Libraries**:
  - Laravel Excel (CSV/Excel exports)
  - DomPDF (PDF generation)
- **API Documentation**: L5-Swagger (OpenAPI/Swagger)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast notifications)
- **Charts**: Recharts (for SLA compliance trends)
- **Form Validation**: Zod + React Hook Form

## 📋 Requirements

### System Requirements
- **PHP**: 8.3 or higher
- **Composer**: Latest version
- **Node.js**: 18 or higher
- **npm**: Included with Node.js
- **MySQL**: 8.0 or higher

### PHP Extensions
- `ext-fileinfo` - File type detection
- `ext-gd` - Image processing
- `ext-zip` - Excel export support
- `ext-mbstring` - String handling
- `ext-xml` - XML processing
- `ext-curl` - HTTP requests

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ricardoguimaraes2021/GearLog.git
cd GearLog
```

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Configure your database in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=gearlog
# DB_USERNAME=root
# DB_PASSWORD=your_password

php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Backend will run on: **http://localhost:8000**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

### 4. Create Super Admin Account (Optional)
```bash
cd backend
php artisan db:seed --class=SuperAdminSeeder
```

This creates a super admin account:
- **Email**: `admin@admin.com`
- **Password**: `admin123`

**Important**: Change the password in production!

### 5. Configure Super Admin (Optional)
Add your super admin email(s) to `.env`:
```env
SUPER_ADMIN_EMAILS=admin@admin.com,your-email@example.com
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/api/documentation
- **Landing Page**: http://localhost:5173/landing
- **Admin Panel**: http://localhost:5173/admin (super admin only)
- **Live Gallery**: [https://gearlogallery.vercel.app/](https://gearlogallery.vercel.app/)

## 🔑 Default Credentials

After running migrations with seeders, you can login with:

- **Super Admin**: `admin@admin.com` / `admin123` (for admin panel access)
- **Admin**: `admin@gearlog.local` / `password`
- **Manager**: `gestor@gearlog.local` / `password`
- **Technician**: `tecnico@gearlog.local` / `password`
- **Read-only**: `consulta@gearlog.local` / `password`

**Note**: The super admin account is created via `SuperAdminSeeder`. Run `php artisan db:seed --class=SuperAdminSeeder` to create it.

## 📁 Project Structure

```
GearLog/
├── backend/                      # Laravel 11 API
│   ├── app/
│   │   ├── Console/Commands/     # Artisan commands
│   │   ├── Exceptions/           # Custom exceptions
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # API controllers
│   │   │   └── Middleware/       # Custom middleware
│   │   ├── Models/               # Eloquent models
│   │   ├── Policies/             # Authorization policies
│   │   └── Services/             # Business logic services
│   ├── database/
│   │   ├── migrations/           # Database migrations
│   │   └── seeders/              # Database seeders
│   ├── routes/
│   │   └── api.php               # API routes
│   └── storage/                  # File storage
│       └── app/public/           # Public files (images, QR codes)
├── frontend/                     # React 18 + Vite application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API client
│   │   ├── stores/               # Zustand state stores
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utility functions
│   └── public/                   # Static assets
├── docs/                         # Documentation
│   ├── API_REFERENCE.md          # Complete API reference
│   ├── CHANGELOG.md              # Version history
│   ├── DATABASE_SETUP.md         # Database security and setup guide
│   ├── IMPROVEMENTS.md           # Future roadmap
│   ├── MIGRATION_ORDER.md        # Migration dependencies
│   ├── NOTIFICATIONS.md          # Notifications guide
│   ├── PRD.md                    # Product Requirements Document
│   ├── PROJECT_GAPS.md           # Project gaps analysis
│   ├── PROJECT_PLAN.md           # Architecture & design
│   ├── PUSHER_SETUP.md          # Pusher configuration guide
│   └── README.md                 # Documentation index
├── .github/                      # GitHub workflows
└── README.md                     # This file
```

## 🔧 Development

### Backend Commands
```bash
php artisan migrate              # Run migrations
php artisan migrate:fresh --seed # Reset database with seeders
php artisan db:seed --class=SuperAdminSeeder  # Create super admin account
php artisan storage:link         # Create storage symlink
php artisan rate-limit:clear     # Clear rate limiting cache
php artisan l5-swagger:generate  # Regenerate API docs
php artisan tickets:update-sla-violations  # Update SLA violations
php artisan db:backup            # Create database backup
php artisan db:backup --compress # Create compressed backup
php artisan env:validate          # Validate environment configuration
```

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/api/documentation

The API follows RESTful conventions and uses Laravel Sanctum for authentication.

## 🎯 Use Cases

### IT Asset Management
- Track all IT equipment in one centralized system
- Monitor equipment status and location
- Generate QR codes for quick asset identification
- Export inventory reports for audits

### Support Ticket Management
- Create tickets for equipment issues
- Assign tickets to technicians
- Track SLA compliance
- Monitor resolution times and trends
- Attach files and collaborate via comments

### Inventory Control
- Track stock levels in real-time
- Receive alerts for low stock
- Monitor product movements
- Prevent negative stock with validation

### Reporting & Analytics
- Export data in multiple formats
- View dashboard KPIs
- Track SLA compliance trends
- Analyze ticket metrics

## 🔒 Security Features

### Authentication & Authorization
- **Authentication**: Laravel Sanctum token-based authentication
- **Authorization**: Role-based access control with Spatie Permissions
- **Password Security**: 
  - Minimum 12 characters with complexity requirements (mixed case, numbers, symbols)
  - Password history tracking (prevents reuse of last 5 passwords)
  - Uncompromised password checking (Have I Been Pwned integration)
- **CSRF Protection**: Built-in CSRF token validation
- **Rate Limiting**: API rate limiting to prevent abuse (stricter limits for login/register)

### Database Security
- **SSL/TLS Encryption**: Support for encrypted database connections
- **Connection Security**: Configurable timeouts and connection pooling
- **Database Backups**: Automated daily backups with compression and 30-day retention
- **Audit Logging**: Complete audit trail of user actions (logins, password changes, data modifications)
- **Data Encryption**: Encrypted storage for sensitive fields (serial numbers, employee codes)
- **Query Security**: All queries use parameter binding (no SQL injection vulnerabilities)
- **Index Optimization**: Performance indexes to prevent DoS attacks via slow queries

### Application Security
- **Input Validation**: Server-side validation on all inputs with Zod schemas
- **File Upload Security**: Validated file types and sizes
- **SQL Injection Protection**: Eloquent ORM with parameter binding
- **API Result Sanitization**: API Resources ensure sensitive data is never exposed
- **Error Handling**: Standardized error responses without exposing sensitive information

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on [GitHub](https://github.com/ricardoguimaraes2021/GearLog/issues).
