# GearLog - Quick Start Guide

## ✅ Installation Complete!

All dependencies have been installed and the application is ready to use.

## 🚀 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## 🔑 Default Login Credentials

After seeding, you can login with:

- **Admin**: 
  - Email: `admin@gearlog.local`
  - Password: `password`

- **Manager**: 
  - Email: `gestor@gearlog.local`
  - Password: `password`

- **Technician**: 
  - Email: `tecnico@gearlog.local`
  - Password: `password`

## 📋 What's Installed

### Backend
- ✅ PHP 8.3
- ✅ Composer
- ✅ Laravel 11
- ✅ MySQL 9.5
- ✅ All required packages (Sanctum, Spatie Permissions, Laravel Excel, QR Code generator)

### Frontend
- ✅ Node.js 25.2.0
- ✅ npm 11.6.2
- ✅ React 18
- ✅ Vite
- ✅ TypeScript
- ✅ TailwindCSS
- ✅ All required dependencies

## 🗄️ Database

- Database name: `gearlog`
- All migrations have been run
- Sample data has been seeded (users, roles, permissions, categories)

## 🎯 Next Steps

1. **Open your browser** and navigate to: http://localhost:5173
2. **Login** with the admin credentials above
3. **Start managing** your IT equipment inventory!

## 🛠️ Managing Servers

### Start Backend Server
```bash
cd backend
php artisan serve
```

### Start Frontend Server
```bash
cd frontend
npm run dev
```

### Stop Servers
Press `Ctrl+C` in the terminal where the servers are running.

## 📚 Documentation

- `PROJECT_PLAN.md` - Complete architecture
- `SETUP.md` - Detailed setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Feature checklist
- `README.md` - Project overview

## 🐛 Troubleshooting

### Backend not responding?
- Check if MySQL is running: `brew services list`
- Start MySQL: `brew services start mysql`
- Check backend logs in the terminal

### Frontend not loading?
- Check if the dev server is running
- Verify port 5173 is not in use
- Check browser console for errors

### Database connection issues?
- Verify MySQL is running
- Check `.env` file in `backend/` directory
- Database credentials: root user, no password (default)

## ✨ Features Available

- ✅ Product CRUD operations
- ✅ Category management
- ✅ Movement tracking
- ✅ QR code generation
- ✅ Image uploads
- ✅ Dashboard with KPIs
- ✅ Search and filtering
- ✅ CSV export
- ✅ Role-based access control

Enjoy using GearLog! 🎉

