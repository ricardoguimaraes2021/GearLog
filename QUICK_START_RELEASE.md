# Quick Start: Generate and Publish .exe

## 🚀 Fastest Method (Using GitHub Actions)

Since you're on macOS, the easiest way is to use GitHub Actions:

### Step 1: Trigger the Build

1. **Go to GitHub Actions:**
   ```
   https://github.com/ricardoguimaraes2021/GearLog/actions
   ```

2. **Click "Build Windows Executable"** (left sidebar)

3. **Click "Run workflow"** (dropdown button on the right)

4. **Select branch:** `main`

5. **Click green "Run workflow" button**

6. **Wait 2-5 minutes** for the build to complete

### Step 2: Download the .exe

1. Click on the completed workflow run
2. Scroll down to "Artifacts" section
3. Click "GearLogSetup.exe" to download

### Step 3: Create Release

1. Go to: `https://github.com/ricardoguimaraes2021/GearLog/releases/new`
2. Create tag: `v1.0.0`
3. Upload the downloaded `GearLogSetup.exe`
4. Click "Publish release"

Done! ✅

---

## Alternative: Build on Windows

If you have a Windows machine:

```bash
# On Windows machine
git clone https://github.com/ricardoguimaraes2021/GearLog.git
cd GearLog
pip install -r requirements-build.txt
python build_exe.py
# File will be in: dist/GearLogSetup.exe
```

Then upload `dist/GearLogSetup.exe` to GitHub Releases.

