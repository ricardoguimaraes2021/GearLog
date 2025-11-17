#!/usr/bin/env python3
"""
GearLog Automated Setup Script
This script automates the complete setup of the GearLog project including:
- Installing required dependencies (PHP, Composer, MySQL, Node.js, npm)
- Cloning the repository (if not already present)
- Configuring backend (Laravel)
- Configuring frontend (React)
- Setting up the database
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path
from typing import Optional, Tuple

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text: str):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text: str):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text: str):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def run_command(command: list, check: bool = True, capture_output: bool = False) -> Tuple[bool, str]:
    """Run a shell command and return success status and output."""
    try:
        result = subprocess.run(
            command,
            check=check,
            capture_output=capture_output,
            text=True
        )
        output = result.stdout if capture_output else ""
        return True, output
    except subprocess.CalledProcessError as e:
        if capture_output:
            return False, e.stderr
        return False, str(e)
    except FileNotFoundError:
        return False, "Command not found"

def check_command(command: str) -> bool:
    """Check if a command exists in the system."""
    success, _ = run_command(["which", command] if platform.system() != "Windows" else ["where", command], check=False)
    return success

def get_system_info() -> dict:
    """Get system information."""
    system = platform.system()
    return {
        "system": system,
        "is_macos": system == "Darwin",
        "is_linux": system == "Linux",
        "is_windows": system == "Windows",
        "home": str(Path.home()),
    }

class DependencyInstaller:
    def __init__(self, system_info: dict):
        self.system = system_info
        self.installed = []
        self.failed = []

    def install_php(self) -> bool:
        """Install PHP 8.3+."""
        print_info("Checking PHP installation...")
        if check_command("php"):
            success, output = run_command(["php", "-v"], capture_output=True)
            if success and "8.3" in output or "8.4" in output or "9." in output:
                print_success("PHP is already installed")
                return True
        
        print_warning("PHP 8.3+ not found. Installing...")
        
        if self.system["is_macos"]:
            if not check_command("brew"):
                print_error("Homebrew is required to install PHP on macOS")
                print_info("Install Homebrew from: https://brew.sh")
                return False
            success, _ = run_command(["brew", "install", "php@8.3"])
            if success:
                print_success("PHP installed successfully")
                print_warning("Add PHP to PATH: echo 'export PATH=\"/opt/homebrew/opt/php@8.3/bin:$PATH\"' >> ~/.zshrc")
                return True
        
        elif self.system["is_linux"]:
            print_info("Installing PHP on Linux...")
            # Try different package managers
            if check_command("apt-get"):
                success, _ = run_command(["sudo", "apt-get", "update"])
                success, _ = run_command(["sudo", "apt-get", "install", "-y", "php8.3", "php8.3-cli", "php8.3-mysql", "php8.3-xml", "php8.3-mbstring", "php8.3-curl", "php8.3-zip"])
            elif check_command("yum"):
                success, _ = run_command(["sudo", "yum", "install", "-y", "php83", "php83-cli", "php83-mysqlnd", "php83-xml", "php83-mbstring", "php83-curl", "php83-zip"])
            else:
                print_error("Unsupported Linux distribution. Please install PHP 8.3+ manually.")
                return False
            
            if success:
                print_success("PHP installed successfully")
                return True
        
        elif self.system["is_windows"]:
            print_error("Windows installation not automated. Please install PHP from: https://windows.php.net/download/")
            return False
        
        return False

    def install_composer(self) -> bool:
        """Install Composer."""
        print_info("Checking Composer installation...")
        if check_command("composer"):
            print_success("Composer is already installed")
            return True
        
        print_warning("Composer not found. Installing...")
        
        if self.system["is_macos"]:
            if check_command("brew"):
                success, _ = run_command(["brew", "install", "composer"])
                if success:
                    print_success("Composer installed successfully")
                    return True
        
        # Install Composer globally using the installer
        print_info("Downloading Composer installer...")
        success, _ = run_command([
            "php", "-r", 
            "copy('https://getcomposer.org/installer', 'composer-setup.php');"
        ])
        
        if not success:
            return False
        
        success, _ = run_command(["php", "composer-setup.php", "--install-dir=/usr/local/bin", "--filename=composer"])
        
        # Cleanup
        if os.path.exists("composer-setup.php"):
            os.remove("composer-setup.php")
        
        if success:
            print_success("Composer installed successfully")
            return True
        
        return False

    def install_mysql(self) -> bool:
        """Install MySQL."""
        print_info("Checking MySQL installation...")
        if check_command("mysql"):
            print_success("MySQL is already installed")
            return True
        
        print_warning("MySQL not found. Installing...")
        
        if self.system["is_macos"]:
            if check_command("brew"):
                success, _ = run_command(["brew", "install", "mysql"])
                if success:
                    print_success("MySQL installed successfully")
                    print_info("Starting MySQL service...")
                    run_command(["brew", "services", "start", "mysql"])
                    print_warning("MySQL root password may be empty by default. You can set it later.")
                    return True
        
        elif self.system["is_linux"]:
            print_info("Installing MySQL on Linux...")
            if check_command("apt-get"):
                success, _ = run_command(["sudo", "apt-get", "install", "-y", "mysql-server"])
            elif check_command("yum"):
                success, _ = run_command(["sudo", "yum", "install", "-y", "mysql-server"])
            else:
                print_error("Unsupported Linux distribution. Please install MySQL manually.")
                return False
            
            if success:
                print_success("MySQL installed successfully")
                print_info("Starting MySQL service...")
                run_command(["sudo", "systemctl", "start", "mysql"])
                run_command(["sudo", "systemctl", "enable", "mysql"])
                return True
        
        elif self.system["is_windows"]:
            print_error("Windows installation not automated. Please install MySQL from: https://dev.mysql.com/downloads/installer/")
            return False
        
        return False

    def install_nodejs(self) -> bool:
        """Install Node.js 18+."""
        print_info("Checking Node.js installation...")
        if check_command("node"):
            success, output = run_command(["node", "-v"], capture_output=True)
            if success:
                version = output.strip().replace("v", "")
                major_version = int(version.split(".")[0])
                if major_version >= 18:
                    print_success(f"Node.js {version} is already installed")
                    return True
        
        print_warning("Node.js 18+ not found. Installing...")
        
        if self.system["is_macos"]:
            if check_command("brew"):
                success, _ = run_command(["brew", "install", "node"])
                if success:
                    print_success("Node.js installed successfully")
                    return True
        
        elif self.system["is_linux"]:
            print_info("Installing Node.js on Linux...")
            # Use NodeSource repository for latest version
            if check_command("curl"):
                run_command(["curl", "-fsSL", "https://deb.nodesource.com/setup_20.x", "-o", "/tmp/nodesource_setup.sh"])
                run_command(["sudo", "bash", "/tmp/nodesource_setup.sh"])
                success, _ = run_command(["sudo", "apt-get", "install", "-y", "nodejs"])
                if success:
                    print_success("Node.js installed successfully")
                    return True
        
        elif self.system["is_windows"]:
            print_error("Windows installation not automated. Please install Node.js from: https://nodejs.org/")
            return False
        
        return False

    def install_all(self) -> bool:
        """Install all required dependencies."""
        print_header("Installing Dependencies")
        
        dependencies = [
            ("PHP 8.3+", self.install_php),
            ("Composer", self.install_composer),
            ("MySQL", self.install_mysql),
            ("Node.js 18+", self.install_nodejs),
        ]
        
        all_success = True
        for name, installer in dependencies:
            try:
                if installer():
                    self.installed.append(name)
                else:
                    self.failed.append(name)
                    all_success = False
            except Exception as e:
                print_error(f"Error installing {name}: {str(e)}")
                self.failed.append(name)
                all_success = False
        
        return all_success

class ProjectSetup:
    def __init__(self, system_info: dict, project_path: Path):
        self.system = system_info
        self.project_path = project_path
        self.backend_path = project_path / "backend"
        self.frontend_path = project_path / "frontend"

    def clone_repository(self, repo_url: str = "https://github.com/ricardoguimaraes2021/GearLog.git") -> bool:
        """Clone the repository if it doesn't exist."""
        if self.project_path.exists() and any(self.project_path.iterdir()):
            print_warning(f"Directory {self.project_path} already exists and is not empty")
            response = input("Do you want to use the existing directory? (y/n): ").strip().lower()
            if response != 'y':
                return False
            print_success("Using existing directory")
            return True
        
        print_info(f"Cloning repository to {self.project_path}...")
        desktop = Path(self.system["home"]) / "Desktop"
        clone_path = desktop / "GearLog"
        
        if clone_path.exists():
            print_warning(f"GearLog already exists on Desktop. Using existing directory.")
            self.project_path = clone_path
            self.backend_path = clone_path / "backend"
            self.frontend_path = clone_path / "frontend"
            return True
        
        success, _ = run_command(["git", "clone", repo_url, str(clone_path)])
        if success:
            print_success("Repository cloned successfully")
            self.project_path = clone_path
            self.backend_path = clone_path / "backend"
            self.frontend_path = clone_path / "frontend"
            return True
        
        return False

    def setup_backend(self) -> bool:
        """Setup Laravel backend."""
        print_header("Setting Up Backend")
        
        if not self.backend_path.exists():
            print_error("Backend directory not found")
            return False
        
        os.chdir(self.backend_path)
        
        # Install Composer dependencies
        print_info("Installing PHP dependencies...")
        success, _ = run_command(["composer", "install"])
        if not success:
            print_error("Failed to install Composer dependencies")
            return False
        print_success("PHP dependencies installed")
        
        # Copy .env.example to .env
        env_example = self.backend_path / ".env.example"
        env_file = self.backend_path / ".env"
        
        if env_example.exists() and not env_file.exists():
            print_info("Creating .env file...")
            shutil.copy(env_example, env_file)
            print_success(".env file created")
        elif not env_file.exists():
            print_warning(".env.example not found. Creating basic .env file...")
            self.create_basic_env()
        
        # Generate application key
        print_info("Generating application key...")
        success, _ = run_command(["php", "artisan", "key:generate"])
        if success:
            print_success("Application key generated")
        
        # Configure database
        print_info("Configuring database...")
        self.configure_database()
        
        # Run migrations
        print_info("Running database migrations...")
        success, _ = run_command(["php", "artisan", "migrate", "--seed"])
        if not success:
            print_warning("Migrations failed. You may need to create the database manually.")
            print_info("Create database: CREATE DATABASE gearlog;")
        else:
            print_success("Database migrations completed")
        
        # Create storage link
        print_info("Creating storage symlink...")
        run_command(["php", "artisan", "storage:link"], check=False)
        print_success("Storage link created")
        
        return True

    def create_basic_env(self):
        """Create a basic .env file if .env.example doesn't exist."""
        env_content = """APP_NAME=GearLog
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
"""
        env_file = self.backend_path / ".env"
        with open(env_file, "w") as f:
            f.write(env_content)

    def configure_database(self):
        """Configure database settings in .env file."""
        env_file = self.backend_path / ".env"
        if not env_file.exists():
            return
        
        print_info("Database configuration:")
        db_name = input("Database name (default: gearlog): ").strip() or "gearlog"
        db_user = input("Database username (default: root): ").strip() or "root"
        db_pass = input("Database password (default: empty): ").strip()
        
        # Read and update .env file
        with open(env_file, "r") as f:
            content = f.read()
        
        # Update database settings
        lines = content.split("\n")
        updated_lines = []
        for line in lines:
            if line.startswith("DB_DATABASE="):
                updated_lines.append(f"DB_DATABASE={db_name}")
            elif line.startswith("DB_USERNAME="):
                updated_lines.append(f"DB_USERNAME={db_user}")
            elif line.startswith("DB_PASSWORD="):
                updated_lines.append(f"DB_PASSWORD={db_pass}")
            else:
                updated_lines.append(line)
        
        with open(env_file, "w") as f:
            f.write("\n".join(updated_lines))
        
        # Create database if it doesn't exist
        print_info(f"Creating database '{db_name}' if it doesn't exist...")
        mysql_command = f"CREATE DATABASE IF NOT EXISTS {db_name};"
        run_command(["mysql", "-u", db_user, f"-p{db_pass}" if db_pass else ""], 
                   input=mysql_command.encode(), check=False)
        
        print_success("Database configured")

    def setup_frontend(self) -> bool:
        """Setup React frontend."""
        print_header("Setting Up Frontend")
        
        if not self.frontend_path.exists():
            print_error("Frontend directory not found")
            return False
        
        os.chdir(self.frontend_path)
        
        # Install npm dependencies
        print_info("Installing npm dependencies...")
        success, _ = run_command(["npm", "install"])
        if not success:
            print_error("Failed to install npm dependencies")
            return False
        print_success("npm dependencies installed")
        
        # Copy .env.example if it exists
        env_example = self.frontend_path / ".env.example"
        env_file = self.frontend_path / ".env"
        
        if env_example.exists() and not env_file.exists():
            print_info("Creating frontend .env file...")
            shutil.copy(env_example, env_file)
            print_success("Frontend .env file created")
        
        return True

    def print_final_instructions(self):
        """Print final setup instructions."""
        print_header("Setup Complete!")
        
        print_success("GearLog has been set up successfully!")
        print("\n" + Colors.BOLD + "Next Steps:" + Colors.ENDC)
        print(f"\n1. {Colors.OKCYAN}Start the backend server:{Colors.ENDC}")
        print(f"   cd {self.backend_path}")
        print("   php artisan serve")
        
        print(f"\n2. {Colors.OKCYAN}Start the frontend server (in a new terminal):{Colors.ENDC}")
        print(f"   cd {self.frontend_path}")
        print("   npm run dev")
        
        print(f"\n3. {Colors.OKCYAN}Access the application:{Colors.ENDC}")
        print("   Frontend: http://localhost:5173")
        print("   Backend API: http://localhost:8000")
        print("   API Docs: http://localhost:8000/api/documentation")
        
        print(f"\n4. {Colors.OKCYAN}Default login credentials:{Colors.ENDC}")
        print("   Admin: admin@gearlog.local / password")
        print("   Manager: gestor@gearlog.local / password")
        print("   Technician: tecnico@gearlog.local / password")
        
        print(f"\n{Colors.WARNING}Note: Make sure MySQL is running before starting the backend!{Colors.ENDC}")
        if self.system["is_macos"]:
            print("   brew services start mysql")
        elif self.system["is_linux"]:
            print("   sudo systemctl start mysql")

def main():
    """Main setup function."""
    print_header("GearLog Automated Setup")
    
    system_info = get_system_info()
    print_info(f"Detected system: {system_info['system']}")
    
    # Check if running as root (not recommended)
    if os.geteuid() == 0 and not system_info["is_windows"]:
        print_warning("Running as root is not recommended. Some commands may fail.")
        response = input("Continue anyway? (y/n): ").strip().lower()
        if response != 'y':
            sys.exit(1)
    
    # Install dependencies
    installer = DependencyInstaller(system_info)
    if not installer.install_all():
        print_warning("Some dependencies failed to install automatically.")
        print_info("Please install them manually and run this script again.")
        if installer.failed:
            print_error(f"Failed: {', '.join(installer.failed)}")
    
    # Setup project
    desktop = Path(system_info["home"]) / "Desktop"
    project_path = desktop / "GearLog"
    
    setup = ProjectSetup(system_info, project_path)
    
    # Clone repository
    if not setup.clone_repository():
        print_error("Failed to clone repository")
        sys.exit(1)
    
    # Setup backend
    if not setup.setup_backend():
        print_error("Backend setup failed")
        sys.exit(1)
    
    # Setup frontend
    if not setup.setup_frontend():
        print_error("Frontend setup failed")
        sys.exit(1)
    
    # Print final instructions
    setup.print_final_instructions()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n" + Colors.WARNING + "Setup cancelled by user" + Colors.ENDC)
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)

