# GearLog - IT Equipment Inventory Management System

A full-stack inventory management system for tracking IT equipment, built with Laravel 11 and React 18.

## 🚀 Quick Start

### Prerequisites
- PHP 8.3+
- Composer
- Node.js 18+
- MySQL 8
- npm or yarn

### Backend Setup

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

Backend will run on: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

## 📁 Project Structure

- `backend/` - Laravel 11 API
- `frontend/` - React 18 + Vite application
- `PROJECT_PLAN.md` - Detailed architecture and implementation plan

## 🔑 Default Credentials

After seeding, default admin user:
- Email: admin@gearlog.local
- Password: password

## 📚 Documentation

See `PROJECT_PLAN.md` for complete architecture, API endpoints, and implementation details.

## 🛠️ Tech Stack

**Backend:**
- Laravel 11
- PHP 8.3+
- MySQL 8
- Laravel Sanctum (Auth)
- Spatie Permissions (RBAC)

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Zustand
- Axios

