# GearLog - Manual Setup Guide

This guide provides step-by-step instructions for manually setting up the GearLog project.

> **💡 Tip:** For automated setup, use the `setup.py` script or `GearLogSetup.exe` (Windows). See [README.md](../README.md) for automated setup instructions.

## Prerequisites

- PHP 8.3+
- Composer
- Node.js 18+
- MySQL 8
- npm or yarn

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

5. **Configure database in `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=gearlog
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Create the database:**
   ```bash
   mysql -u root -e "CREATE DATABASE gearlog;"
   ```

7. **Run migrations and seeders:**
   ```bash
   php artisan migrate --seed
   ```

8. **Create storage symlink:**
   ```bash
   php artisan storage:link
   ```

9. **Start the backend server:**
   ```bash
   php artisan serve
   ```
   Backend will run on: **http://localhost:8000**

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install npm dependencies:**
   ```bash
   npm install
   ```

3. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on: **http://localhost:5173**

## Default Credentials

After seeding, you can login with:

- **Admin:** `admin@gearlog.local` / `password`
- **Manager:** `gestor@gearlog.local` / `password`
- **Technician:** `tecnico@gearlog.local` / `password`

## Troubleshooting

### Windows-Specific Issues

For Windows-specific setup issues (PHP extensions, MySQL configuration, etc.), see [MANUAL_SETUP_WINDOWS.md](../MANUAL_SETUP_WINDOWS.md).

### Database Issues

If you encounter database-related problems, see [FIX_DATABASE.md](../FIX_DATABASE.md).

## Next Steps

- Access the application at: http://localhost:5173
- View API documentation at: http://localhost:8000/api/documentation
- Check the [PROJECT_PLAN.md](../PROJECT_PLAN.md) for architecture details
- See [IMPROVEMENTS.md](../IMPROVEMENTS.md) for future enhancements
