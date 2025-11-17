#!/bin/bash
# GearLog Automated Setup Script (Bash version for macOS/Linux)
# This is a simpler alternative to the Python script

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)

print_header "GearLog Automated Setup"

# Check for Homebrew (macOS) or package manager (Linux)
if [[ "$OS" == "macos" ]]; then
    if ! command_exists brew; then
        print_error "Homebrew is required. Install from: https://brew.sh"
        exit 1
    fi
    print_success "Homebrew found"
fi

# Install dependencies
print_header "Installing Dependencies"

# PHP
if ! command_exists php || ! php -v | grep -q "8\.[3-9]\|9\."; then
    print_warning "PHP 8.3+ not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install php@8.3
        print_warning "Add PHP to PATH: echo 'export PATH=\"/opt/homebrew/opt/php@8.3/bin:\$PATH\"' >> ~/.zshrc"
    elif [[ "$OS" == "linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y php8.3 php8.3-cli php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip
    fi
else
    print_success "PHP is installed"
fi

# Composer
if ! command_exists composer; then
    print_warning "Composer not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install composer
    else
        curl -sS https://getcomposer.org/installer | php
        sudo mv composer.phar /usr/local/bin/composer
    fi
else
    print_success "Composer is installed"
fi

# MySQL
if ! command_exists mysql; then
    print_warning "MySQL not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install mysql
        brew services start mysql
    elif [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y mysql-server
        sudo systemctl start mysql
        sudo systemctl enable mysql
    fi
else
    print_success "MySQL is installed"
fi

# Node.js
if ! command_exists node || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    print_warning "Node.js 18+ not found. Installing..."
    if [[ "$OS" == "macos" ]]; then
        brew install node
    elif [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    print_success "Node.js is installed"
fi

# Clone repository
print_header "Setting Up Project"

DESKTOP="$HOME/Desktop"
PROJECT_DIR="$DESKTOP/GearLog"

if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR)" ]; then
    print_warning "GearLog already exists on Desktop"
    read -p "Use existing directory? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_info "Cloning repository..."
    git clone https://github.com/ricardoguimaraes2021/GearLog.git "$PROJECT_DIR"
    print_success "Repository cloned"
fi

# Setup backend
print_header "Setting Up Backend"

cd "$PROJECT_DIR/backend"

print_info "Installing PHP dependencies..."
composer install
print_success "PHP dependencies installed"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created"
    else
        print_warning ".env.example not found. Creating basic .env..."
        cat > .env << EOF
APP_NAME=GearLog
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearlog
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
EOF
    fi
fi

print_info "Generating application key..."
php artisan key:generate
print_success "Application key generated"

print_info "Configuring database..."
read -p "Database name (default: gearlog): " DB_NAME
DB_NAME=${DB_NAME:-gearlog}
read -p "Database username (default: root): " DB_USER
DB_USER=${DB_USER:-root}
read -sp "Database password (default: empty): " DB_PASS
echo

# Update .env file
sed -i.bak "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" .env
sed -i.bak "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" .env
sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
rm .env.bak 2>/dev/null || true

# Create database
print_info "Creating database..."
mysql -u "$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || print_warning "Could not create database automatically. Please create it manually."

print_info "Running migrations..."
php artisan migrate --seed || print_warning "Migrations failed. Please check database connection."
print_success "Database setup complete"

print_info "Creating storage link..."
php artisan storage:link
print_success "Storage link created"

# Setup frontend
print_header "Setting Up Frontend"

cd "$PROJECT_DIR/frontend"

print_info "Installing npm dependencies..."
npm install
print_success "npm dependencies installed"

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    print_success "Frontend .env file created"
fi

# Final instructions
print_header "Setup Complete!"

print_success "GearLog has been set up successfully!"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo
echo "1. Start the backend server:"
echo "   cd $PROJECT_DIR/backend"
echo "   php artisan serve"
echo
echo "2. Start the frontend server (in a new terminal):"
echo "   cd $PROJECT_DIR/frontend"
echo "   npm run dev"
echo
echo "3. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/api/documentation"
echo
echo "4. Default login credentials:"
echo "   Admin: admin@gearlog.local / password"
echo "   Manager: gestor@gearlog.local / password"
echo "   Technician: tecnico@gearlog.local / password"
echo
print_warning "Note: Make sure MySQL is running before starting the backend!"
if [[ "$OS" == "macos" ]]; then
    echo "   brew services start mysql"
elif [[ "$OS" == "linux" ]]; then
    echo "   sudo systemctl start mysql"
fi

