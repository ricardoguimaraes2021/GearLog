# Changelog

All notable changes to GearLog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-18

### 🎉 First Stable Release

This is the first stable release of GearLog, a comprehensive IT equipment inventory management system.

### ✨ Added

#### Core Features
- **Product Management**
  - Complete CRUD operations for products
  - Product categories management
  - Image upload and optimization
  - QR code generation for each product
  - Public product view accessible via QR code
  - Product specifications support
  - Purchase date tracking with validation
  - Status management (new, used, damaged, repair, reserved)

- **Ticket Management System**
  - Complete ticket CRUD operations
  - Ticket assignment to technicians
  - Multiple ticket types (damage, maintenance, update, audit, other)
  - Priority levels (low, medium, high, critical)
  - Status workflow (open → in_progress → waiting_parts → resolved → closed)
  - Ticket comments with file attachments
  - Complete activity logs
  - Ticket dashboard with comprehensive metrics

- **SLA (Service Level Agreement) Tracking**
  - Automated SLA deadline calculation by priority
  - Real-time SLA violation detection
  - SLA at-risk warnings (80% time elapsed)
  - Compliance rate tracking
  - Historical compliance trend charts
  - Automated SLA violation updates via scheduled command

- **Employee Management**
  - Complete employee directory
  - Employee profiles with assigned assets and tickets
  - Status management (active/inactive)
  - Department assignment
  - Employee export (CSV, Excel, PDF)
  - Activity logs for all employee actions
  - Deactivate/reactivate functionality

- **Department Management**
  - Department directory with manager assignment
  - Cost center tracking
  - Department profiles with employees, assets, and tickets
  - Usage analytics and statistics
  - Department dashboard with KPIs

- **Asset Assignment System**
  - Checkout/check-in system for assets
  - Assignment history tracking
  - Condition tracking on return
  - Automatic product status updates
  - Validation rules (assignable products, active employees)
  - Assignment history by employee or asset

- **Movement Tracking**
  - Movement types (entry, exit, allocation, return)
  - Stock validation (prevent negative stock)
  - Assigned to tracking
  - Movement history grouped by purchase date
  - Notes and documentation
  - Recent activities view

#### Dashboard & Analytics
- Comprehensive KPIs (products, tickets, employees)
- Expandable smart alerts:
  - Low stock products with lists
  - Damaged products with details
  - Inactive products (no movement in 30+ days)
  - SLA violated tickets
  - SLA at-risk tickets
  - Critical tickets
  - Unassigned tickets
- Recent activities (movements and assignments)
- Visual analytics and charts
- Products by category breakdown

#### User Experience
- Modern UI built with shadcn/ui and TailwindCSS
- Fully responsive design (desktop, tablet, mobile)
- Mobile navigation with hamburger menu
- Toast notifications (no browser alerts)
- Loading states with skeleton loaders
- Error boundaries and user-friendly error messages
- Client-side form validation with Zod
- Persistent authentication with token storage

#### Security & Access Control
- Role-Based Access Control (RBAC) with Spatie Permissions
- User roles: Admin, Manager, Technician, Read-only
- Laravel Sanctum authentication
- CSRF protection
- API rate limiting

#### Export & Reporting
- Multiple export formats (CSV, Excel, PDF)
- Product exports with all details
- Employee exports with department information
- Filtered exports (export only search results)
- Professional PDF reports with formatting

#### Real-time Features
- WebSocket-based real-time notifications (Pusher)
- Notification bell with unread count badge
- Notification dropdown with recent items
- Full notifications feed page
- Toast notifications for immediate alerts
- Notification types: ticket events, SLA violations, low stock, product damage

#### Public Access
- QR code scanning to view product details without login
- Shareable product information pages
- Mobile-friendly QR code scanning

#### Documentation
- Complete API Reference documentation
- Product Requirements Document (PRD)
- Migration order and dependencies guide
- Notifications setup guide
- Comprehensive README with setup instructions

### 🔧 Technical Details

#### Backend
- Laravel 11 framework
- PHP 8.3+
- MySQL 8 database
- Laravel Sanctum for authentication
- Spatie Permissions for RBAC
- Intervention Image for image processing
- Simple QR Code for QR generation
- Laravel Excel for exports
- DomPDF for PDF generation
- L5-Swagger for API documentation

#### Frontend
- React 18
- TypeScript
- Vite build tool
- TailwindCSS for styling
- shadcn/ui components
- Zustand for state management
- Axios for HTTP requests
- React Router v6 for routing
- Recharts for charts
- Sonner for toast notifications
- Laravel Echo + Pusher for real-time

### 📝 Documentation
- Complete API reference
- Product Requirements Document
- Migration order guide
- Notifications setup guide
- Project gaps analysis

### 🐛 Fixed
- Department asset count calculation
- Date validation in assignments (prevent future dates)
- Card layout consistency issues
- Button visibility on landing page
- Footer link functionality
- SLA Compliance Trend graph data display
- Product allocation to employees

### 🔄 Changed
- Navigation reorganized (Inventory page with sub-navigation)
- Improved error handling
- Enhanced form validation
- Better mobile responsiveness

### 📦 Installation

See [README.md](README.md) for complete installation instructions.

### 🔗 Links
- [GitHub Repository](https://github.com/ricardoguimaraes2021/GearLog)
- [API Documentation](http://localhost:8000/api/documentation) (when running locally)
- [Documentation](./docs/README.md)

### ⚠️ Breaking Changes
None in this initial release.

### 🙏 Acknowledgments
Thanks to all contributors and users of GearLog!

---

[Unreleased]: https://github.com/ricardoguimaraes2021/GearLog/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ricardoguimaraes2021/GearLog/releases/tag/v1.0.0

