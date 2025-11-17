#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GearLog Multi-Platform Automated Setup Script
Version: 1.1

Suporta:
- Windows (usa winget quando disponível; fallback instructions)
- macOS (Homebrew)
- Linux (apt-get / yum)

Funcionalidades:
- Detecta SO e dependências (PHP >= 8.3, Composer, MySQL, Node.js 18+)
- Tenta instalar automaticamente onde for possível
- Adiciona PHP ao PATH no Windows quando necessário
- Clona repositório Git (padrão: GitHub do utilizador)
- Configura backend Laravel (composer install, .env, key:generate, migrate)
- Configura frontend (npm install)
- Interações mínimas (apenas pede dados essenciais: DB)
- Logging detalhado para ficheiro no Desktop
"""

from __future__ import annotations

import os
import sys
import subprocess
import platform
import shutil
import logging
import traceback
import re
from pathlib import Path
from typing import Optional, Tuple, List

# ---------------------------
# Logging & utilidade
# ---------------------------
HOME = Path.home()
DESKTOP = HOME / "Desktop"
LOG_FILE = DESKTOP / "GearLog_Setup_Log.txt"

# Configurar logging para ficheiro + stdout
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("gearlog.setup")

# Colors (apenas se terminal suportar)
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def color_text(text: str, color: str) -> str:
    """Safe color text that falls back to plain text on Windows."""
    try:
        if platform.system() == "Windows":
            # Windows console may not support ANSI colors
            return text
        return f"{color}{text}{Colors.ENDC}"
    except Exception:
        return text

def print_header(text: str):
    border = "=" * 72
    print()
    print(color_text(border, Colors.HEADER))
    print(color_text(text.center(72), Colors.HEADER + Colors.BOLD))
    print(color_text(border, Colors.HEADER))
    print()

def print_success(text: str):
    try:
        print(color_text(f"✓ {text}", Colors.OKGREEN))
    except (UnicodeEncodeError, AttributeError):
        print(f"[OK] {text}")
    logger.info(f"SUCCESS: {text}")

def print_error(text: str):
    try:
        print(color_text(f"✗ {text}", Colors.FAIL))
    except (UnicodeEncodeError, AttributeError):
        print(f"[ERROR] {text}")
    logger.error(f"ERROR: {text}")

def print_warning(text: str):
    try:
        print(color_text(f"⚠ {text}", Colors.WARNING))
    except (UnicodeEncodeError, AttributeError):
        print(f"[WARNING] {text}")
    logger.warning(f"WARNING: {text}")

def print_info(text: str):
    try:
        print(color_text(f"ℹ {text}", Colors.OKCYAN))
    except (UnicodeEncodeError, AttributeError):
        print(f"[INFO] {text}")
    logger.info(f"INFO: {text}")

# ---------------------------
# Helpers para comandos
# ---------------------------
def run_command(cmd: List[str], check: bool=True, capture_output: bool=False, env=None, shell: bool=False) -> Tuple[bool, str]:
    """
    Executa um comando e devolve (success, output).
    - capture_output: tenta devolver stdout (ou stderr em caso de erro).
    - shell: se True, executa via shell (útil em Windows para comandos complexos).
    """
    logger.debug("Executando comando: %s (shell=%s)", " ".join(cmd) if isinstance(cmd, list) else str(cmd), shell)
    try:
        if capture_output:
            proc = subprocess.run(
                cmd, 
                check=check, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True, 
                encoding='utf-8',
                errors='replace',
                env=env, 
                shell=shell
            )
            out = proc.stdout.strip()
            err = proc.stderr.strip()
            if proc.returncode == 0:
                logger.debug("Comando saiu com sucesso. Saída (primeiros 1000 chars): %s", out[:1000])
                return True, out
            else:
                logger.error("Comando retornou código %s. Stderr: %s", proc.returncode, err)
                return False, err or out
        else:
            proc = subprocess.run(cmd, check=check, env=env, shell=shell, encoding='utf-8', errors='replace')
            return True, ""
    except subprocess.CalledProcessError as e:
        out = e.stdout or ""
        err = e.stderr or str(e)
        logger.error("CalledProcessError: %s", err)
        return False, err
    except FileNotFoundError as e:
        logger.error("FileNotFoundError: %s", e)
        return False, str(e)
    except Exception as e:
        logger.exception("Erro inesperado ao executar comando")
        return False, str(e)

def which(cmd: str) -> Optional[str]:
    """Cross-platform wrapper for shutil.which"""
    path = shutil.which(cmd)
    logger.debug("which(%s) -> %s", cmd, path)
    return path

# ---------------------------
# System detection
# ---------------------------
def get_system_info() -> dict:
    system = platform.system()
    return {
        "system": system,
        "is_windows": system == "Windows",
        "is_macos": system == "Darwin",
        "is_linux": system == "Linux",
        "home": str(HOME),
        "desktop": str(DESKTOP),
        "python_version": sys.version,
    }

# ---------------------------
# Dependency installer
# ---------------------------
class DependencyInstaller:
    def __init__(self, sys_info: dict):
        self.sys = sys_info
        self.installed: List[str] = []
        self.failed: List[str] = []

    def check_php_version_ok(self, required_major: int = 8, required_minor: int = 3) -> Tuple[bool, Optional[str]]:
        """Verifica se 'php' está instalado e se a versão é >= required_major.required_minor"""
        path = which("php")
        if not path:
            return False, None
        
        ok, out = run_command(["php", "-v"], capture_output=True)
        if not ok:
            return False, None
        
        first_line = out.splitlines()[0] if out else ""
        logger.debug("php -v -> %s", first_line)
        
        m = re.search(r"PHP\s+(\d+)\.(\d+)\.(\d+)", first_line)
        if not m:
            m2 = re.search(r"PHP\s+(\d+)\.(\d+)", first_line)
            if not m2:
                return False, first_line
            major = int(m2.group(1))
            minor = int(m2.group(2))
        else:
            major = int(m.group(1))
            minor = int(m.group(2))
        
        if (major > required_major) or (major == required_major and minor >= required_minor):
            return True, f"{major}.{minor}"
        return False, f"{major}.{minor}"

    def check_node_version_ok(self, required_major: int = 18) -> Tuple[bool, Optional[str]]:
        path = which("node")
        if not path:
            return False, None
        
        ok, out = run_command(["node", "-v"], capture_output=True)
        if not ok:
            return False, None
        
        v = out.strip().lstrip("v")
        try:
            major = int(v.split(".")[0])
            return (major >= required_major), v
        except Exception:
            return False, v

    def check_composer(self) -> bool:
        return which("composer") is not None

    def check_mysql(self) -> bool:
        return which("mysql") is not None

    def install_with_winget(self, package_id: str, friendly_name: str) -> bool:
        """Tenta instalar um pacote com winget (Windows)."""
        if not which("winget"):
            print_warning("winget não encontrado no sistema Windows.")
            return False
        
        print_info(f"Tentando instalar {friendly_name} via winget...")
        ok, out = run_command(
            ["winget", "install", "--id", package_id, "--silent", "--accept-package-agreements", "--accept-source-agreements"],
            check=False,
            capture_output=True
        )
        if ok:
            print_success(f"{friendly_name} instalado via winget.")
            return True
        else:
            print_warning(f"winget não conseguiu instalar {friendly_name}. Saída: {out[:200]}")
            return False

    def add_php_to_path_windows(self, php_executable_path: str) -> bool:
        """Adiciona o diretório do php.exe ao PATH do utilizador via setx."""
        try:
            php_dir = str(Path(php_executable_path).parent)
            print_info(f"Adicionando PHP ao PATH do utilizador: {php_dir}")
            
            # Read current user PATH
            ok, current_path = run_command(
                ["powershell", "-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('PATH','User')"],
                capture_output=True,
                check=False
            )
            if not ok:
                current_path = ""
            
            # Evitar duplicados
            if php_dir.lower() in (current_path or "").lower():
                print_info("PHP já está no PATH do utilizador.")
                return True
            
            # Use setx to update user PATH
            new_path = f"{current_path};{php_dir}" if current_path else php_dir
            setx_cmd = f'setx PATH "{new_path}"'
            ok2, out2 = run_command(setx_cmd, check=False, capture_output=True, shell=True)
            
            if ok2:
                print_success("PHP adicionado ao PATH do utilizador. Fecha e abre o terminal para aplicar.")
                return True
            else:
                print_warning("Não foi possível usar setx para definir PATH automaticamente.")
                logger.debug("setx saída: %s", out2)
                return False
        except Exception as e:
            logger.exception("Erro ao tentar adicionar PHP ao PATH")
            return False

    def install_php(self) -> bool:
        """Instala PHP dependendo do SO."""
        print_info("Verificando PHP...")
        ok, ver = self.check_php_version_ok()
        if ok:
            print_success(f"PHP ok (versão {ver})")
            return True
        
        print_warning("PHP 8.3+ não está disponível ou não foi detectado.")
        
        if self.sys["is_windows"]:
            tried = False
            if which("winget"):
                tried = self.install_with_winget("PHP.PHP", "PHP")
            
            if not tried:
                print_warning("Se preferires posso tentar instalar PHP manualmente. Recomendo instalar a versão Windows VC15/x64 em https://windows.php.net/download/")
                return False
            
            # Após instalar, tentar localizar php.exe e adicionar ao PATH
            php_path = which("php")
            if not php_path:
                print_warning("PHP instalado mas não encontrado no PATH atual. Podes precisar de reiniciar o terminal.")
                php_path = which("php")
            
            if php_path:
                self.add_php_to_path_windows(php_path)
            return True
        
        elif self.sys["is_macos"]:
            if not which("brew"):
                print_error("Homebrew não encontrado. Instala Homebrew: https://brew.sh")
                return False
            
            print_info("Instalando PHP via brew (php@8.3)...")
            ok, out = run_command(["brew", "install", "php@8.3"], check=False, capture_output=True)
            if ok:
                print_success("PHP instalado via Homebrew. Podes querer adicionar /opt/homebrew/opt/php@8.3/bin ao PATH.")
                return True
            
            ok2, _ = run_command(["brew", "install", "php"], check=False)
            return ok2
        
        elif self.sys["is_linux"]:
            if which("apt-get"):
                print_info("Tentando instalar PHP via apt (php8.3)...")
                run_command(["sudo", "apt-get", "update"], check=False)
                ok, out = run_command(
                    ["sudo", "apt-get", "install", "-y", "php8.3", "php8.3-cli", "php8.3-mysql", "php8.3-xml", "php8.3-mbstring", "php8.3-curl", "php8.3-zip"],
                    check=False,
                    capture_output=True
                )
                if ok:
                    print_success("PHP 8.3 instalado via apt.")
                    return True
                
                ok2, _ = run_command(["sudo", "apt-get", "install", "-y", "php", "php-cli"], check=False)
                return ok2
            elif which("yum"):
                print_info("Tentando instalar PHP via yum...")
                ok, _ = run_command(["sudo", "yum", "install", "-y", "php", "php-cli", "php-mysqlnd"], check=False)
                return ok
            else:
                print_error("Distribuição Linux não suportada automaticamente. Instala PHP manualmente.")
                return False
        
        return False

    def install_composer(self) -> bool:
        """Instala Composer globalmente."""
        print_info("Verificando Composer...")
        if self.check_composer():
            print_success("Composer já instalado.")
            return True
        
        if self.sys["is_windows"]:
            if which("winget"):
                ok = self.install_with_winget("Composer.Composer", "Composer")
                if ok:
                    return True
            
            print_info("Tentando instalar Composer via instalador oficial...")
            tmp = Path(os.getcwd()) / "composer-setup.php"
            ok, _ = run_command(
                ["php", "-r", "copy('https://getcomposer.org/installer', 'composer-setup.php');"],
                check=False,
                capture_output=True
            )
            if not ok:
                print_warning("Não foi possível baixar o instalador composer-setup.php automaticamente.")
                return False
            
            # Try common Windows locations
            install_paths = [
                "C:\\ProgramData\\ComposerSetup\\bin",
                "C:\\Program Files\\Composer",
                str(Path.home() / "AppData" / "Roaming" / "Composer" / "bin"),
            ]
            
            for install_path in install_paths:
                Path(install_path).mkdir(parents=True, exist_ok=True)
                ok2, _ = run_command(
                    ["php", "composer-setup.php", f"--install-dir={install_path}", "--filename=composer"],
                    check=False
                )
                if ok2:
                    try:
                        if Path("composer-setup.php").exists():
                            Path("composer-setup.php").unlink()
                    except Exception:
                        pass
                    return True
            
            try:
                if Path("composer-setup.php").exists():
                    Path("composer-setup.php").unlink()
            except Exception:
                pass
            return False
        
        elif self.sys["is_macos"]:
            if which("brew"):
                ok, _ = run_command(["brew", "install", "composer"], check=False)
                if ok:
                    print_success("Composer instalado via Homebrew.")
                    return True
            
            print_info("Instalando Composer via instalador PHP...")
            ok, _ = run_command(
                ["php", "-r", "copy('https://getcomposer.org/installer', 'composer-setup.php');"],
                check=False,
                capture_output=True
            )
            if not ok:
                return False
            
            ok2, _ = run_command(["php", "composer-setup.php", "--install-dir=/usr/local/bin", "--filename=composer"], check=False)
            try:
                if Path("composer-setup.php").exists():
                    Path("composer-setup.php").unlink()
            except Exception:
                pass
            return ok2
        
        elif self.sys["is_linux"]:
            if which("apt-get"):
                print_info("Tentando instalar composer via apt...")
                ok, _ = run_command(["sudo", "apt-get", "install", "-y", "composer"], check=False)
                if ok:
                    return True
            
            ok, _ = run_command(
                ["php", "-r", "copy('https://getcomposer.org/installer', 'composer-setup.php');"],
                check=False,
                capture_output=True
            )
            if not ok:
                return False
            
            ok2, _ = run_command(["php", "composer-setup.php", "--install-dir=/usr/local/bin", "--filename=composer"], check=False)
            if Path("composer-setup.php").exists():
                Path("composer-setup.php").unlink()
            return ok2
        
        return False

    def install_mysql(self) -> bool:
        """Instala MySQL / MariaDB dependendo do SO."""
        print_info("Verificando MySQL client/server...")
        if self.check_mysql():
            print_success("MySQL client já disponível.")
            return True
        
        if self.sys["is_windows"]:
            if which("winget"):
                ok = self.install_with_winget("MySQL.MySQLServer", "MySQL Server")
                if ok:
                    print_warning("Após a instalação no Windows, configurações iniciais (password/root) podem ser solicitadas.")
                    return True
            
            print_warning("winget não instalou MySQL. Recomendo baixar o instalador MySQL Installer manualmente: https://dev.mysql.com/downloads/installer/")
            return False
        
        elif self.sys["is_macos"]:
            if which("brew"):
                ok, _ = run_command(["brew", "install", "mysql"], check=False)
                if ok:
                    print_success("MySQL instalado via Homebrew.")
                    run_command(["brew", "services", "start", "mysql"], check=False)
                    return True
            
            print_warning("Não foi possível instalar MySQL automaticamente via brew.")
            return False
        
        elif self.sys["is_linux"]:
            if which("apt-get"):
                print_info("Instalando mysql-server via apt...")
                ok, _ = run_command(["sudo", "apt-get", "install", "-y", "mysql-server"], check=False)
                if ok:
                    run_command(["sudo", "systemctl", "start", "mysql"], check=False)
                    run_command(["sudo", "systemctl", "enable", "mysql"], check=False)
                    return True
            elif which("yum"):
                ok, _ = run_command(["sudo", "yum", "install", "-y", "mysql-server"], check=False)
                if ok:
                    run_command(["sudo", "systemctl", "start", "mysqld"], check=False)
                    run_command(["sudo", "systemctl", "enable", "mysqld"], check=False)
                    return True
            else:
                print_warning("Não foi possível identificar gestor de pacotes para instalar MySQL automaticamente.")
                return False
        
        return False

    def install_node(self) -> bool:
        """Instala Node.js (recomendado 18+)."""
        print_info("Verificando Node.js...")
        ok, ver = self.check_node_version_ok()
        if ok:
            print_success(f"Node.js ok (versão {ver})")
            return True
        
        print_warning("Node.js 18+ não detectado.")
        
        if self.sys["is_windows"]:
            if which("winget"):
                ok = self.install_with_winget("OpenJS.NodeJS", "Node.js (OpenJS)")
                if ok:
                    return True
            
            print_warning("winget não instalou Node.js. Baixa manualmente de https://nodejs.org/")
        
        elif self.sys["is_macos"]:
            if which("brew"):
                ok, _ = run_command(["brew", "install", "node"], check=False)
                if ok:
                    print_success("Node.js instalado via Homebrew.")
                    return True
            
            print_warning("Node.js não instalado automaticamente no macOS.")
        
        elif self.sys["is_linux"]:
            if which("curl"):
                print_info("Configurando NodeSource para instalar Node.js (20.x)")
                run_command(["curl", "-fsSL", "https://deb.nodesource.com/setup_20.x", "-o", "/tmp/nodesource_setup.sh"], check=False)
                run_command(["sudo", "bash", "/tmp/nodesource_setup.sh"], check=False)
                ok, _ = run_command(["sudo", "apt-get", "install", "-y", "nodejs"], check=False)
                if ok:
                    print_success("Node.js instalado via NodeSource.")
                    return True
            
            if which("apt-get"):
                ok, _ = run_command(["sudo", "apt-get", "install", "-y", "nodejs", "npm"], check=False)
                return ok
        
        return False

    def install_all(self) -> bool:
        """Tenta instalar todas as dependências necessárias."""
        print_header("Instalação de Dependências")
        
        wanted = [
            ("PHP 8.3+", self.install_php),
            ("Composer", self.install_composer),
            ("MySQL (server/client)", self.install_mysql),
            ("Node.js 18+", self.install_node),
        ]
        
        all_ok = True
        for name, fn in wanted:
            try:
                ok = fn()
                if ok:
                    self.installed.append(name)
                else:
                    self.failed.append(name)
                    all_ok = False
                    print_warning(f"{name} não foi instalado automaticamente.")
            except Exception as e:
                logger.exception("Erro ao instalar %s", name)
                self.failed.append(name)
                all_ok = False
        
        return all_ok

# ---------------------------
# Project setup
# ---------------------------
class ProjectSetup:
    def __init__(self, sys_info: dict, project_dir: Optional[Path] = None, repo_url: str = "https://github.com/ricardoguimaraes2021/GearLog.git"):
        self.sys = sys_info
        self.repo_url = repo_url
        if project_dir:
            self.project_dir = Path(project_dir).expanduser().resolve()
        else:
            self.project_dir = Path(self.sys["desktop"]) / "GearLog"
        
        self.backend_dir = self.project_dir / "backend"
        self.frontend_dir = self.project_dir / "frontend"

    def clone_repository(self) -> bool:
        """Clona o repositório se não existir. Se existir, pergunta se quer usar."""
        print_header("Clonagem do Repositório")
        
        if self.project_dir.exists() and any(self.project_dir.iterdir()):
            print_warning(f"O diretório {self.project_dir} já existe e não está vazio.")
            resp = input("Desejas usar o diretório existente? (y/n) [y]: ").strip().lower() or "y"
            if resp != "y":
                print_info("Abortando clonagem por escolha do utilizador.")
                return False
            print_success("Usando diretório existente.")
            return True
        
        Path(self.sys["desktop"]).mkdir(parents=True, exist_ok=True)
        
        print_info(f"Clonando {self.repo_url} para {self.project_dir} ...")
        ok, out = run_command(["git", "clone", self.repo_url, str(self.project_dir)], check=False, capture_output=True)
        if ok:
            print_success("Repositório clonado com sucesso.")
            return True
        else:
            print_error(f"Falha ao clonar: {out}")
            return False

    def create_basic_env_backend(self):
        """Cria um .env básico no backend caso não exista .env.example"""
        logger.info("Criando .env básico no backend (se necessário).")
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
        env_path = self.backend_dir / ".env"
        try:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(env_content)
            print_success(f".env criado em {env_path}")
        except Exception as e:
            logger.exception("Erro criando .env básico")
            print_error("Não foi possível criar .env básico.")

    def setup_backend(self) -> bool:
        """Configura o backend Laravel (composer install, .env, key, migrate)."""
        print_header("Configuração do Backend (Laravel)")
        
        if not self.backend_dir.exists():
            print_error(f"Diretório backend não encontrado: {self.backend_dir}")
            return False
        
        cwd = os.getcwd()
        os.chdir(self.backend_dir)
        
        try:
            # composer install
            if which("composer"):
                print_info("Executando composer install...")
                ok, out = run_command(["composer", "install", "--no-interaction"], check=False, capture_output=True)
                if ok:
                    print_success("Dependências PHP instaladas (composer).")
                else:
                    print_warning("composer install falhou ou retornou warnings. Continua-se o setup.")
                    logger.debug("Composer output: %s", out[:2000] if out else "sem output")
            else:
                print_warning("Composer não encontrado. Skipping composer install.")
            
            # .env handling
            env_example = self.backend_dir / ".env.example"
            env_file = self.backend_dir / ".env"
            
            if env_example.exists() and not env_file.exists():
                shutil.copy(env_example, env_file)
                print_success(".env copiado de .env.example")
            elif not env_file.exists():
                print_warning(".env.example não encontrado; criando .env básico.")
                self.create_basic_env_backend()
            
            # Perguntar configurações essenciais da BD
            print_info("Configuração da base de dados (entrada mínima).")
            db_name = input("Nome da BD (default: gearlog): ").strip() or "gearlog"
            db_user = input("Utilizador BD (default: root): ").strip() or "root"
            db_pass = input("Password BD (podem existir caracteres especiais) (default: vazio): ").strip() or ""
            
            # atualiza .env
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                content = ""
            
            def replace_env_var(content: str, key: str, value: str) -> str:
                pattern = rf"^{re.escape(key)}=.*$"
                repl = f"{key}={value}"
                if re.search(pattern, content, flags=re.MULTILINE):
                    content = re.sub(pattern, repl, content, flags=re.MULTILINE)
                else:
                    content += "\n" + repl + "\n"
                return content
            
            content = replace_env_var(content, "DB_DATABASE", db_name)
            content = replace_env_var(content, "DB_USERNAME", db_user)
            content = replace_env_var(content, "DB_PASSWORD", db_pass)
            
            with open(env_file, "w", encoding="utf-8") as f:
                f.write(content)
            
            print_success(".env atualizado com as credenciais da BD (mínimas).")
            
            # Gerar app key
            if which("php"):
                print_info("Gerando application key (php artisan key:generate)...")
                ok, out = run_command(["php", "artisan", "key:generate", "--force"], check=False, capture_output=True)
                if ok:
                    print_success("Application key gerada.")
                else:
                    print_warning(f"Não foi possível gerar application key automaticamente: {out[:200]}")
            else:
                print_warning("PHP não encontrado; não é possível executar artisan.")
            
            # Criar base de dados (tentativa)
            print_info(f"Tentando criar base de dados '{db_name}' (se não existir)...")
            if which("mysql"):
                # Use mysql command with proper password handling
                if db_pass:
                    # For Windows, we might need to use environment variable
                    env = os.environ.copy()
                    env['MYSQL_PWD'] = db_pass
                    mysql_cmd = ["mysql", "-u", db_user, "-e", f"CREATE DATABASE IF NOT EXISTS {db_name};"]
                    ok, out = run_command(mysql_cmd, check=False, capture_output=True, env=env)
                else:
                    mysql_cmd = ["mysql", "-u", db_user, "-e", f"CREATE DATABASE IF NOT EXISTS {db_name};"]
                    ok, out = run_command(mysql_cmd, check=False, capture_output=True)
                
                if ok:
                    print_success(f"Base de dados {db_name} assegurada.")
                else:
                    print_warning("Não foi possível criar a base de dados automaticamente. Podes criar manualmente.")
                    logger.debug("MySQL create DB output: %s", out[:500] if out else "sem output")
            else:
                print_warning("Cliente MySQL não encontrado, salta criação automática da BD.")
            
            # Migrations
            if which("php"):
                print_info("Executando migrations (php artisan migrate --seed)...")
                ok, out = run_command(["php", "artisan", "migrate", "--seed", "--force"], check=False, capture_output=True)
                if ok:
                    print_success("Migrations executadas com sucesso.")
                else:
                    print_warning("Migrations falharam ou foram parcialmente executadas. Verifica logs.")
                    logger.error("Migration failed: %s", out[:2000] if out else "sem output")
                    print_error(f"Erro detalhado: {out[:500] if out else 'Sem detalhes'}")
            else:
                print_warning("PHP não disponível, não é possível correr migrations.")
            
            # Storage link
            if which("php"):
                run_command(["php", "artisan", "storage:link"], check=False)
                print_success("storage:link executado (se aplicável).")
            
            return True
        
        except Exception as e:
            logger.exception("Erro durante setup do backend")
            print_error(f"Erro durante setup do backend: {e}")
            traceback.print_exc()
            return False
        finally:
            os.chdir(cwd)

    def setup_frontend(self) -> bool:
        """Configura o frontend (npm install)."""
        print_header("Configuração do Frontend (React)")
        
        if not self.frontend_dir.exists():
            print_error(f"Diretório frontend não encontrado: {self.frontend_dir}")
            return False
        
        cwd = os.getcwd()
        os.chdir(self.frontend_dir)
        
        try:
            if which("npm"):
                print_info("Executando npm install...")
                ok, out = run_command(["npm", "install"], check=False, capture_output=True)
                if ok:
                    print_success("Dependências npm instaladas.")
                else:
                    print_warning("npm install retornou erro ou warnings. Verifica a saída.")
                    logger.debug("npm install output: %s", out[:2000] if out else "sem output")
            else:
                print_warning("npm não encontrado; por favor instala Node.js (que inclui npm).")
                return False
            
            # copiar .env.example se existir
            env_example = self.frontend_dir / ".env.example"
            env_file = self.frontend_dir / ".env"
            
            if env_example.exists() and not env_file.exists():
                shutil.copy(env_example, env_file)
                print_success("Frontend .env criado a partir de .env.example")
            
            return True
        
        except Exception as e:
            logger.exception("Erro durante setup do frontend")
            print_error(f"Erro durante setup do frontend: {e}")
            traceback.print_exc()
            return False
        finally:
            os.chdir(cwd)

    def print_final_instructions(self):
        print_header("Instruções Finais")
        print_success("Setup concluído (ou concluído parcialmente). Lê as mensagens acima para detalhes.")
        print()
        print(color_text("Próximos passos (manuais):", Colors.BOLD))
        print("1) Garantir que o MySQL está em execução.")
        if self.sys["is_windows"]:
            print("   - Verifica o serviço MySQL ou usa o MySQL Workbench / MySQL Installer.")
        elif self.sys["is_macos"]:
            print("   - brew services start mysql")
        elif self.sys["is_linux"]:
            print("   - sudo systemctl start mysql")
        print()
        print("2) Iniciar backend (Laravel):")
        print(f"   cd \"{self.backend_dir}\"")
        print("   php artisan serve --host=127.0.0.1 --port=8000")
        print()
        print("3) Iniciar frontend (React/Vite):")
        print(f"   cd \"{self.frontend_dir}\"")
        print("   npm run dev")
        print()
        print("4) Endereços:")
        print("   Frontend: http://localhost:5173")
        print("   Backend API: http://localhost:8000")
        print("   API Docs: http://localhost:8000/api/documentation")
        print()
        print("5) Credenciais por defeito (se existirem fixtures/seeds):")
        print("   Admin: admin@gearlog.local / password")
        print("   Manager: gestor@gearlog.local / password")
        print("   Technician: tecnico@gearlog.local / password")
        print()
        print_warning("Reabre o terminal/PowerShell depois de alterações ao PATH para aplicar as alterações (Windows).")

# ---------------------------
# Main
# ---------------------------
def pause_before_exit():
    """Pause before exiting to allow user to see output."""
    try:
        if platform.system() == "Windows":
            print("\n" + "=" * 60)
            print("Pressiona Enter para sair...")
            try:
                import msvcrt
                msvcrt.getch()
            except ImportError:
                input()
        else:
            input("\nPress Enter to exit...")
    except Exception:
        pass

def main():
    try:
        logger.info("=== GearLog Multi-Platform Setup iniciado ===")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Platform: {platform.platform()}")
        logger.info(f"Log file: {LOG_FILE}")
        
        print_header("GearLog - Setup Multi-Platform")
        print_info(f"Log file location: {LOG_FILE}")
        
        sys_info = get_system_info()
        logger.info("Sistema detectado: %s", sys_info["system"])
        print_info(f"Sistema detectado: {sys_info['system']}")
        
        # Aviso se for root/admin
        if not sys_info["is_windows"]:
            try:
                if os.geteuid() == 0:
                    print_warning("Estás a correr este script como root. Não é recomendado mas o script continuará.")
            except AttributeError:
                pass
        
        installer = DependencyInstaller(sys_info)
        print_info("Vou tentar instalar automaticamente as dependências necessárias (PHP, Composer, MySQL, Node).")
        resp_install = input("Continuar com tentativas de instalação automática? (y/n) [y]: ").strip().lower() or "y"
        
        if resp_install == "y":
            ok_all = installer.install_all()
            if not ok_all:
                print_warning("Algumas dependências não foram instaladas automaticamente. Verifica o log e as mensagens acima.")
                if installer.failed:
                    print_warning("Falharam: " + ", ".join(installer.failed))
        else:
            print_info("Ignorando instalação automática. Assume que tens dependências instaladas manualmente.")
        
        # Project setup
        project_dir_input = input(f"Caminho para o projecto (enter usa '{sys_info['desktop']}/GearLog'): ").strip()
        project_dir = Path(project_dir_input) if project_dir_input else Path(sys_info["desktop"]) / "GearLog"
        
        setup = ProjectSetup(sys_info, project_dir=project_dir, repo_url="https://github.com/ricardoguimaraes2021/GearLog.git")
        
        if not setup.clone_repository():
            print_error("Não foi possível clonar ou usar diretório do repositório. Aborting.")
            pause_before_exit()
            sys.exit(1)
        
        # Backend setup
        if (setup.project_dir / "backend").exists():
            ok_backend = setup.setup_backend()
            if not ok_backend:
                print_warning("Setup do backend encontrou problemas. Continua-se para frontend.")
        else:
            print_warning("Diretório backend não existe. Saltando setup backend.")
        
        # Frontend setup
        if (setup.project_dir / "frontend").exists():
            ok_front = setup.setup_frontend()
            if not ok_front:
                print_warning("Setup do frontend encontrou problemas.")
        else:
            print_warning("Diretório frontend não existe. Saltando setup frontend.")
        
        setup.print_final_instructions()
        print_success(f"Log completo guardado em: {LOG_FILE}")
        
    except KeyboardInterrupt:
        logger.warning("Interrupção pelo utilizador (KeyboardInterrupt).")
        print_warning("Setup cancelado pelo utilizador.")
    except Exception as e:
        logger.exception("Erro crítico")
        print_error(f"Erro crítico: {e}")
        traceback.print_exc()
    finally:
        pause_before_exit()

if __name__ == "__main__":
    main()
