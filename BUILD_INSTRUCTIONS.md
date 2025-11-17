# Building the Windows Executable

This guide explains how to build the `GearLogSetup.exe` executable from the Python setup script.

## Prerequisites

- Python 3.8+ installed
- pip (Python package manager)

## Building the Executable

### Option 1: Using the Build Script (Recommended)

1. Install PyInstaller:
   ```bash
   pip install -r requirements-build.txt
   ```

2. Run the build script:
   ```bash
   python build_exe.py
   ```

3. The executable will be created in the `dist` folder:
   ```
   dist/GearLogSetup.exe
   ```

### Option 2: Manual Build with PyInstaller

1. Install PyInstaller:
   ```bash
   pip install pyinstaller
   ```

2. Build the executable:
   ```bash
   pyinstaller --onefile --name=GearLogSetup --console --clean --noconfirm setup.py
   ```

3. The executable will be in the `dist` folder.

## Building for Release

When building for release, you may want to:

1. **Add an icon** (optional):
   - Create or download an `icon.ico` file
   - Place it in the project root
   - The build script will automatically use it

2. **Test the executable**:
   - Run `dist/GearLogSetup.exe` on a clean Windows machine
   - Verify all functionality works correctly

3. **Upload to GitHub Releases**:
   - Create a new release on GitHub
   - Upload `GearLogSetup.exe` as a release asset
   - Tag the release appropriately
   - **See `GITHUB_RELEASE_GUIDE.md` for detailed instructions**

## File Size

The executable will be approximately 10-15 MB (includes Python runtime and all dependencies).

## Troubleshooting

### "PyInstaller not found"
```bash
pip install pyinstaller
```

### "Module not found" errors
Make sure all dependencies used in `setup.py` are installed:
```bash
pip install -r requirements-build.txt
```

### Large file size
This is normal - PyInstaller bundles Python and all dependencies into a single executable.

### Antivirus warnings
Some antivirus software may flag PyInstaller executables as suspicious. This is a false positive. You can:
- Submit the file to your antivirus vendor for analysis
- Sign the executable with a code signing certificate (for production)

## Notes

- The executable is Windows-specific
- macOS/Linux users should use the Python script directly
- The executable requires no Python installation on the target machine
- All dependencies are bundled into the single .exe file

