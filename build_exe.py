#!/usr/bin/env python3
"""
Build script to create a standalone .exe executable from setup.py
This script uses PyInstaller to bundle the setup script into a single executable file.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_pyinstaller():
    """Check if PyInstaller is installed."""
    try:
        import PyInstaller
        return True
    except ImportError:
        return False

def install_pyinstaller():
    """Install PyInstaller."""
    print_info("Installing PyInstaller...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
    print_success("PyInstaller installed successfully!")

def build_exe():
    """Build the executable using PyInstaller."""
    print_info("Building executable...")
    
    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",  # Create a single executable file
        "--name=GearLogSetup",  # Name of the executable
        "--console",  # Console application (shows terminal)
        "--clean",  # Clean PyInstaller cache
        "--noconfirm",  # Overwrite output directory without asking
        "setup.py"
    ]
    
    # Add icon if available (optional)
    icon_path = Path("icon.ico")
    if icon_path.exists():
        cmd.extend(["--icon", str(icon_path)])
    
    try:
        subprocess.check_call(cmd)
        print_success("\nExecutable built successfully!")
        print(f"  Location: dist/GearLogSetup.exe")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"\nError building executable: {e}")
        return False

def main():
    """Main build function."""
    print("=" * 60)
    print("GearLog Setup - Executable Builder")
    print("=" * 60)
    print()
    
    # Check if setup.py exists
    if not Path("setup.py").exists():
        print_error("setup.py not found in current directory")
        sys.exit(1)
    
    # Check/install PyInstaller
    if not check_pyinstaller():
        print_info("PyInstaller not found. Installing...")
        try:
            install_pyinstaller()
        except Exception as e:
            print_error(f"Error installing PyInstaller: {e}")
            print("\nPlease install PyInstaller manually:")
            print("  pip install pyinstaller")
            sys.exit(1)
    
    # Build the executable
    if build_exe():
        print("\n" + "=" * 60)
        print("Build Complete!")
        print("=" * 60)
        print("\nThe executable is located in the 'dist' folder:")
        print("  dist/GearLogSetup.exe")
        print("\nYou can distribute this file to users who don't have Python installed.")
        print("\nNote: The executable is Windows-specific.")
        print("For macOS/Linux, users should use the Python script directly.")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

