# GearLog - IT Equipment Inventory Management System

A full-stack inventory management system for tracking IT equipment, built with Laravel 11 and React 18.

## 🚀 Quick Start

### Prerequisites

- PHP 8.3+
- Composer
- Node.js 18+
- MySQL 8
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ricardoguimaraes2021/GearLog.git
   cd GearLog
   ```

2. **Backend Setup**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   
   # Configure database in .env
   # DB_CONNECTION=mysql
   # DB_HOST=127.0.0.1
   # DB_PORT=3306
   # DB_DATABASE=gearlog
   # DB_USERNAME=root
   # DB_PASSWORD=
   
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve
   ```
   Backend runs on: **http://localhost:8000**

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on: **http://localhost:5173**

## 🔑 Default Credentials

After seeding, you can login with:

- **Admin**: `admin@gearlog.local` / `password`
- **Manager**: `gestor@gearlog.local` / `password`
- **Technician**: `tecnico@gearlog.local` / `password`

## ✨ Features

- ✅ Complete product inventory management
- ✅ Category organization
- ✅ Movement tracking (entrada, saída, alocação, devolução)
- ✅ QR code generation for products
- ✅ Image uploads with optimization
- ✅ Real-time dashboard with KPIs
- ✅ Advanced search and filtering
- ✅ Export to CSV, Excel, and PDF
- ✅ Role-based access control (RBAC)
- ✅ Public product view via QR code
- ✅ Low stock alerts
- ✅ Purchase date tracking

## 🛠️ Tech Stack

**Backend:**
- Laravel 11
- PHP 8.3+
- MySQL 8
- Laravel Sanctum (Authentication)
- Spatie Permissions (RBAC)
- Laravel Excel (Exports)
- DomPDF (PDF generation)
- Simple QR Code (QR code generation)
- Intervention Image (Image optimization)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Zustand (State management)
- Axios (HTTP client)
- React Router (Routing)

## 📁 Project Structure

```
GearLog/
├── backend/          # Laravel 11 API
├── frontend/         # React 18 + Vite application
├── docs/             # Additional documentation
├── README.md         # This file
├── PROJECT_PLAN.md   # Detailed architecture
└── IMPROVEMENTS.md   # Future improvements
```

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete architecture, API endpoints, and database schema
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - Future improvements and feature roadmap
- **[docs/SETUP.md](./docs/SETUP.md)** - Detailed setup instructions
- **[docs/](./docs/)** - Additional documentation and guides

## 🔧 Development

### Running the Application

**Backend:**
```bash
cd backend
php artisan serve
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### API Documentation

Once the backend is running, access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/api/documentation

### Useful Commands

**Backend:**
```bash
php artisan migrate              # Run migrations
php artisan migrate:fresh --seed # Reset database with seeders
php artisan storage:link         # Create storage symlink
php artisan rate-limit:clear     # Clear rate limiting cache
php artisan l5-swagger:generate  # Regenerate API docs
```

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🐛 Troubleshooting

### Rate Limit Issues
If you get "Too Many Attempts" error:
```bash
cd backend
php artisan rate-limit:clear
```

### Storage Issues
If images/QR codes don't display:
```bash
cd backend
php artisan storage:link
chmod -R 775 storage
```

### Database Issues
```bash
# Check MySQL is running
brew services list

# Start MySQL
brew services start mysql

# Reset database
php artisan migrate:fresh --seed
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
