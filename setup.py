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
def resolve_command_path(cmd: str) -> Optional[str]:
    """Resolve o caminho completo de um comando, incluindo extensões .bat, .cmd, .exe no Windows."""
    system = platform.system()
    
    # Primeiro tenta shutil.which (padrão)
    path = shutil.which(cmd)
    if path:
        return path
    
    # No Windows, tenta extensões específicas
    if system == "Windows":
        extensions = ['.bat', '.cmd', '.exe']
        for ext in extensions:
            path = shutil.which(cmd + ext)
            if path:
                return path
        
        # Tenta localizar composer.bat em locais comuns do Windows
        if cmd == "composer":
            common_paths = [
                Path("C:/ProgramData/ComposerSetup/bin/composer.bat"),
                Path("C:/Program Files/Composer/composer.bat"),
                Path.home() / "AppData/Roaming/Composer/vendor/bin/composer.bat",
            ]
            for path in common_paths:
                if path.exists():
                    return str(path)
    
    return None

def run_command(cmd: List[str], check: bool=True, capture_output: bool=False, env=None, shell: Optional[bool]=None) -> Tuple[bool, str]:
    """
    Executa um comando e devolve (success, output).
    - capture_output: tenta devolver stdout (ou stderr em caso de erro).
    - shell: se None, detecta automaticamente se deve usar shell (Windows para .bat/.cmd).
    """
    is_windows = platform.system() == "Windows"
    
    # Auto-detect shell=True no Windows para comandos que podem ser .bat/.cmd
    if shell is None:
        if is_windows and cmd:
            # Comandos que no Windows são tipicamente .bat/.cmd
            cmd_needs_shell = cmd[0].lower() in ['composer', 'npm', 'npx', 'php', 'artisan', 'git']
            shell = cmd_needs_shell
        else:
            shell = False
    
    # Resolve caminho completo do comando no Windows
    if is_windows and cmd and not Path(cmd[0]).is_absolute():
        resolved = resolve_command_path(cmd[0])
        if resolved:
            cmd = [resolved] + cmd[1:]
            logger.debug("Comando resolvido: %s -> %s", cmd[0] if len(cmd) > 0 else "", resolved)
    
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
        error_msg = str(e)
        if is_windows and "[WinError 2]" in error_msg:
            cmd_name = cmd[0] if cmd else "comando desconhecido"
            error_msg = f"Comando '{cmd_name}' não encontrado. No Windows, certifique-se de que está no PATH ou reinicie o terminal após instalar. Erro: {error_msg}"
            logger.error("FileNotFoundError (Windows): %s", error_msg)
        else:
            logger.error("FileNotFoundError: %s", error_msg)
        return False, error_msg
    except Exception as e:
        logger.exception("Erro inesperado ao executar comando")
        return False, str(e)

def which(cmd: str) -> Optional[str]:
    """Cross-platform wrapper for shutil.which, com suporte para extensões Windows."""
    path = resolve_command_path(cmd)
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
# PHP Extensions Helper
# ---------------------------
def is_admin_windows() -> bool:
    """Verifica se o script está rodando como administrador no Windows."""
    if platform.system() != "Windows":
        return False
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def check_php_extension(extension: str) -> bool:
    """Verifica se uma extensão PHP está carregada."""
    ok, out = run_command(["php", "-m"], capture_output=True)
    if not ok:
        return False
    return extension.lower() in out.lower()

def get_php_ini_path() -> Optional[str]:
    """Obtém o caminho do php.ini usando php --ini."""
    ok, out = run_command(["php", "--ini"], capture_output=True)
    if not ok:
        return None
    
    # Procura por "Loaded Configuration File:"
    for line in out.splitlines():
        if "Loaded Configuration File:" in line:
            path = line.split(":", 1)[1].strip()
            if path and path != "(none)":
                return path
    
    return None

def enable_php_extension(extension: str) -> Tuple[bool, str]:
    """
    Tenta habilitar uma extensão PHP no php.ini.
    Retorna (success, message).
    """
    php_ini_path = get_php_ini_path()
    if not php_ini_path:
        return False, "Não foi possível localizar o php.ini"
    
    php_ini_file = Path(php_ini_path)
    if not php_ini_file.exists():
        return False, f"php.ini não encontrado em: {php_ini_path}"
    
    try:
        # Ler conteúdo do php.ini
        with open(php_ini_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        
        lines = content.splitlines()
        modified = False
        new_lines = []
        
        # Procurar pela extensão
        extension_line = f"extension={extension}"
        extension_line_win = f"extension=php_{extension}.dll"
        extension_line_unix = f"extension={extension}.so"
        
        found = False
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # Se encontrar a extensão comentada, descomenta
            if stripped.startswith(f";{extension_line}") or \
               stripped.startswith(f";{extension_line_win}") or \
               stripped.startswith(f";{extension_line_unix}"):
                # Descomenta a linha
                new_line = line.replace(";", "", 1).lstrip()
                new_lines.append(new_line)
                modified = True
                found = True
                logger.info(f"Descomentada linha: {line} -> {new_line}")
            # Se encontrar a extensão já habilitada
            elif stripped.startswith(extension_line) or \
                 stripped.startswith(extension_line_win) or \
                 stripped.startswith(extension_line_unix):
                new_lines.append(line)
                found = True
            else:
                new_lines.append(line)
        
        # Se não encontrou, adiciona no final da seção de extensões
        if not found:
            # Procura pela seção [Extensions] ou adiciona no final
            ext_section_found = False
            for i, line in enumerate(new_lines):
                if "[Extensions]" in line or "extension=" in line.lower():
                    # Adiciona após a última linha de extensão
                    j = i + 1
                    while j < len(new_lines) and (new_lines[j].strip().startswith("extension=") or 
                                                   new_lines[j].strip().startswith(";extension=") or
                                                   new_lines[j].strip() == ""):
                        j += 1
                    new_lines.insert(j, f"extension={extension}")
                    modified = True
                    found = True
                    logger.info(f"Adicionada nova linha de extensão: extension={extension}")
                    break
            
            if not found:
                # Adiciona no final do arquivo
                new_lines.append(f"\n; Added by GearLog Setup")
                new_lines.append(f"extension={extension}")
                modified = True
                logger.info(f"Adicionada extensão no final do arquivo: extension={extension}")
        
        # Escrever de volta se modificado
        if modified:
            # No Windows, pode precisar de permissões de administrador
            try:
                with open(php_ini_file, "w", encoding="utf-8") as f:
                    f.write("\n".join(new_lines))
                return True, f"Extensão {extension} habilitada com sucesso em {php_ini_path}"
            except PermissionError:
                return False, f"Permissão negada para editar {php_ini_path}. Execute como administrador."
            except Exception as e:
                return False, f"Erro ao editar php.ini: {str(e)}"
        elif found:
            return True, f"Extensão {extension} já está habilitada"
        else:
            return False, f"Não foi possível localizar ou adicionar a extensão {extension}"
    
    except Exception as e:
        logger.exception(f"Erro ao processar php.ini")
        return False, f"Erro ao processar php.ini: {str(e)}"

def check_and_enable_php_extensions() -> Tuple[bool, List[str]]:
    """
    Verifica e habilita extensões PHP necessárias.
    Retorna (all_ok, missing_extensions).
    """
    required_extensions = ["fileinfo", "gd", "zip"]
    missing = []
    
    print_info("Verificando extensões PHP necessárias...")
    
    for ext in required_extensions:
        if not check_php_extension(ext):
            missing.append(ext)
            print_warning(f"Extensão PHP '{ext}' não está habilitada.")
    
    if not missing:
        print_success("Todas as extensões PHP necessárias estão habilitadas.")
        return True, []
    
    # Verificar se tem permissões de administrador no Windows
    is_admin = is_admin_windows()
    php_ini_path = get_php_ini_path()
    
    if platform.system() == "Windows" and not is_admin and php_ini_path:
        print_warning("\n" + "="*60)
        print_warning("PERMISSÕES DE ADMINISTRADOR NECESSÁRIAS")
        print_warning("="*60)
        print_warning("Para habilitar as extensões PHP automaticamente, este script precisa")
        print_warning("ser executado como Administrador no Windows.")
        print_warning("\nOpções:")
        print_warning("1. Execute este script como Administrador:")
        print_warning("   - Clique com botão direito no terminal/PowerShell")
        print_warning("   - Selecione 'Executar como administrador'")
        print_warning("   - Execute o script novamente")
        print_warning("\n2. Ou edite manualmente o php.ini:")
        print_warning(f"   Arquivo: {php_ini_path}")
        print_warning("   Procure e descomente (remova o ';' do início) estas linhas:")
        for ext in missing:
            print_warning(f"     ;extension={ext}  ->  extension={ext}")
        print_warning("   Depois, REINICIE O TERMINAL e execute o script novamente.")
        print_warning("="*60 + "\n")
        
        response = input("Deseja continuar mesmo sem permissões de administrador? (y/n) [n]: ").strip().lower()
        if response != 'y':
            return False, missing
    
    print_info(f"Tentando habilitar extensões em falta: {', '.join(missing)}")
    
    # Tentar habilitar automaticamente
    failed = []
    for ext in missing:
        success, message = enable_php_extension(ext)
        if success:
            print_success(f"Extensão '{ext}': {message}")
            # Verificar novamente se foi habilitada
            if check_php_extension(ext):
                missing.remove(ext)
            else:
                print_warning(f"Extensão '{ext}' foi adicionada ao php.ini mas ainda não está carregada.")
                print_warning("REINICIE O TERMINAL para carregar as extensões e execute o script novamente.")
        else:
            print_warning(f"Extensão '{ext}': {message}")
            failed.append(ext)
    
    if failed:
        php_ini_path = get_php_ini_path()
        print_error("\n" + "="*60)
        print_error("NÃO FOI POSSÍVEL HABILITAR EXTENSÕES AUTOMATICAMENTE")
        print_error("="*60)
        print_error("Por favor, edite manualmente o php.ini:")
        if php_ini_path:
            print_error(f"  Arquivo: {php_ini_path}")
        print_error("\n  Passos:")
        print_error("  1. Abra o arquivo php.ini em um editor de texto (como administrador)")
        print_error("  2. Procure estas linhas e remova o ';' do início:")
        for ext in failed:
            print_error(f"     ;extension={ext}  ->  extension={ext}")
        print_error("  3. Se não encontrar, adicione estas linhas na seção de extensões:")
        for ext in failed:
            print_error(f"     extension={ext}")
        print_error("  4. Salve o arquivo")
        print_error("  5. REINICIE O TERMINAL completamente")
        print_error("  6. Execute o script novamente")
        print_error("="*60 + "\n")
        return False, failed
    
    if missing:
        print_warning("\n⚠ IMPORTANTE: As extensões foram habilitadas no php.ini,")
        print_warning("mas só serão carregadas quando o PHP for reiniciado.")
        print_warning("Por favor, REINICIE O TERMINAL e execute o script novamente.\n")
        return False, missing
    
    return True, []

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
        
        # Verificar se composer.json existe
        composer_json = self.backend_dir / "composer.json"
        if not composer_json.exists():
            print_error(f"composer.json não encontrado em {self.backend_dir}")
            return False
        
        # Verificar e habilitar extensões PHP necessárias
        if which("php"):
            extensions_ok, missing = check_and_enable_php_extensions()
            if not extensions_ok and missing:
                print_warning("Algumas extensões PHP ainda estão em falta. Tentando continuar...")
                print_info("Se composer install falhar, você precisará habilitar manualmente as extensões.")
        
        cwd = os.getcwd()
        os.chdir(self.backend_dir)
        
        try:
            # composer install - CRÍTICO: deve funcionar antes de continuar
            composer_path = which("composer")
            if not composer_path:
                print_error("Composer não encontrado no PATH. Por favor, instale o Composer primeiro.")
                print_info("No Windows, pode ser necessário reiniciar o terminal após instalar o Composer.")
                return False
            
            print_info("Executando composer install...")
            ok, out = run_command(["composer", "install", "--no-interaction"], check=False, capture_output=True)
            if not ok:
                # Verificar se o erro é relacionado a extensões PHP
                if "ext-" in out and "missing from your system" in out:
                    # Extrair extensões faltantes do erro do composer
                    import re
                    missing_exts = re.findall(r'ext-(\w+)\s*\*', out)
                    if not missing_exts:
                        # Fallback: procurar por padrões comuns
                        if "ext-fileinfo" in out:
                            missing_exts.append("fileinfo")
                        if "ext-gd" in out:
                            missing_exts.append("gd")
                        if "ext-zip" in out:
                            missing_exts.append("zip")
                    
                    if missing_exts:
                        missing_exts = list(set(missing_exts))  # Remove duplicados
                        print_error("composer install FALHOU devido a extensões PHP em falta.")
                        print_error(f"O Composer precisa das extensões: {', '.join(missing_exts)}")
                        
                        # Tentar habilitar as extensões faltantes
                        print_info(f"Tentando habilitar extensões PHP em falta: {', '.join(missing_exts)}")
                        for ext in missing_exts:
                            if not check_php_extension(ext):
                                success, message = enable_php_extension(ext)
                                if success:
                                    print_success(f"Extensão '{ext}': {message}")
                                else:
                                    print_warning(f"Extensão '{ext}': {message}")
                        
                        # Verificar novamente
                        extensions_ok, missing = check_and_enable_php_extensions()
                    
                    if missing:
                        php_ini_path = get_php_ini_path()
                        is_admin = is_admin_windows()
                        
                        print_error("\n" + "="*70)
                        print_error("⚠ AÇÃO NECESSÁRIA: HABILITAR EXTENSÕES PHP")
                        print_error("="*70)
                        print_error("O composer install falhou porque as extensões PHP não estão habilitadas.")
                        print_error("\n📝 SOLUÇÃO:")
                        
                        if not is_admin and platform.system() == "Windows":
                            print_error("\n1️⃣  EXECUTE ESTE SCRIPT COMO ADMINISTRADOR:")
                            print_error("   - Feche este terminal")
                            print_error("   - Clique com botão direito no PowerShell/Terminal")
                            print_error("   - Selecione 'Executar como administrador'")
                            print_error("   - Execute o script novamente")
                            print_error("\n   OU")
                        
                        print_error("\n2️⃣  EDITE MANUALMENTE O PHP.INI:")
                        if php_ini_path:
                            print_error(f"   Arquivo: {php_ini_path}")
                        print_error("\n   Passos:")
                        print_error("   a) Abra o arquivo php.ini em um editor de texto")
                        if not is_admin:
                            print_error("      (pode precisar executar o editor como administrador)")
                        print_error("   b) Procure estas linhas e remova o ';' do início:")
                        for ext in missing:
                            print_error(f"      ;extension={ext}  →  extension={ext}")
                        print_error("   c) Se não encontrar, adicione estas linhas na seção de extensões:")
                        for ext in missing:
                            print_error(f"      extension={ext}")
                        print_error("   d) Salve o arquivo")
                        print_error("   e) REINICIE O TERMINAL completamente")
                        print_error("   f) Execute o script novamente")
                        print_error("\n" + "="*70 + "\n")
                        return False
                    else:
                        print_warning("\n⚠ IMPORTANTE:")
                        print_warning("As extensões foram habilitadas no php.ini,")
                        print_warning("mas só serão carregadas quando o PHP for reiniciado.")
                        print_warning("\nPor favor:")
                        print_warning("1. REINICIE O TERMINAL completamente")
                        print_warning("2. Execute o script novamente\n")
                        return False
                
                print_error("composer install FALHOU. Não é possível continuar sem as dependências PHP.")
                print_error(f"Erro: {out[:500] if out else 'Sem detalhes'}")
                logger.error("Composer install failed: %s", out[:2000] if out else "sem output")
                return False
            
            # Verificar se vendor/autoload.php foi criado
            vendor_autoload = self.backend_dir / "vendor" / "autoload.php"
            if not vendor_autoload.exists():
                print_error("vendor/autoload.php não foi criado. composer install pode ter falhado silenciosamente.")
                return False
            
            print_success("Dependências PHP instaladas (composer).")
            
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
            
            # Verificar se PHP está disponível antes de continuar
            php_path = which("php")
            if not php_path:
                print_error("PHP não encontrado no PATH. Não é possível executar artisan.")
                return False
            
            # Gerar app key
            print_info("Gerando application key (php artisan key:generate)...")
            ok, out = run_command(["php", "artisan", "key:generate", "--force"], check=False, capture_output=True)
            if not ok:
                print_warning(f"Não foi possível gerar application key automaticamente: {out[:200]}")
                logger.warning("Key generation failed: %s", out[:500] if out else "sem output")
            else:
                print_success("Application key gerada.")
            
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
            print_info("Executando migrations (php artisan migrate --seed)...")
            ok, out = run_command(["php", "artisan", "migrate", "--seed", "--force"], check=False, capture_output=True)
            if ok:
                print_success("Migrations executadas com sucesso.")
            else:
                print_warning("Migrations falharam ou foram parcialmente executadas. Verifica logs.")
                logger.error("Migration failed: %s", out[:2000] if out else "sem output")
                print_error(f"Erro detalhado: {out[:500] if out else 'Sem detalhes'}")
            
            # Storage link
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
        
        # Verificar se package.json existe
        package_json = self.frontend_dir / "package.json"
        if not package_json.exists():
            print_error(f"package.json não encontrado em {self.frontend_dir}")
            return False
        
        cwd = os.getcwd()
        os.chdir(self.frontend_dir)
        
        try:
            npm_path = which("npm")
            if not npm_path:
                print_error("npm não encontrado no PATH. Por favor, instale Node.js (que inclui npm).")
                print_info("No Windows, pode ser necessário reiniciar o terminal após instalar o Node.js.")
                return False
            
            print_info("Executando npm install...")
            ok, out = run_command(["npm", "install"], check=False, capture_output=True)
            if not ok:
                print_error("npm install FALHOU. Não é possível continuar sem as dependências do frontend.")
                print_error(f"Erro: {out[:500] if out else 'Sem detalhes'}")
                logger.error("npm install failed: %s", out[:2000] if out else "sem output")
                return False
            
            # Verificar se node_modules foi criado
            node_modules = self.frontend_dir / "node_modules"
            if not node_modules.exists() or not any(node_modules.iterdir()):
                print_warning("node_modules não foi criado ou está vazio. npm install pode ter falhado silenciosamente.")
                logger.warning("node_modules check failed")
            else:
                print_success("Dependências npm instaladas.")
            
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
