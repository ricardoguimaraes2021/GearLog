# GearLog Setup Instructions

## Prerequisites

- PHP 8.3+
- Composer
- Node.js 18+
- MySQL 8
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install PHP dependencies:
```bash
composer install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Configure your database in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearlog
DB_USERNAME=root
DB_PASSWORD=your_password
```

6. Create the database:
```sql
CREATE DATABASE gearlog;
```

7. Run migrations and seeders:
```bash
php artisan migrate --seed
```

8. Create storage link:
```bash
php artisan storage:link
```

9. Start the Laravel development server:
```bash
php artisan serve
```

The backend will be available at: http://localhost:8000

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

## Default Credentials

After running the seeders, you can login with:

- **Admin**: admin@gearlog.local / password
- **Manager**: gestor@gearlog.local / password
- **Technician**: tecnico@gearlog.local / password

## Additional Configuration

### CORS Configuration

Make sure your Laravel `.env` has:
```env
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:5173
```

### Storage

Uploaded images and QR codes will be stored in:
- `backend/storage/app/public/products/` (images)
- `backend/storage/app/public/qrcodes/` (QR codes)

Make sure the storage link is created (`php artisan storage:link`).

## Troubleshooting

### Permission Issues
If you encounter permission issues with storage:
```bash
chmod -R 775 backend/storage
chmod -R 775 backend/bootstrap/cache
```

### Database Connection
Ensure MySQL is running and the credentials in `.env` are correct.

### CORS Issues
If you see CORS errors, verify the `SANCTUM_STATEFUL_DOMAINS` setting in `.env`.

