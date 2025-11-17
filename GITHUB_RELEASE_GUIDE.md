# GitHub Release Guide

Complete guide for creating releases and publishing the Windows executable.

This guide explains how to publish the `GearLogSetup.exe` file to GitHub Releases so users can download it.

## Prerequisites

- The `GearLogSetup.exe` file built (see `BUILD_INSTRUCTIONS.md`)
- Access to the GitHub repository: `ricardoguimaraes2021/GearLog`
- Git installed and configured

> **Important:** If you're on macOS/Linux, you cannot build a Windows .exe directly. Use **Option 1: GitHub Actions** (recommended) or build on a Windows machine.

## Step-by-Step Instructions

### Option 1: Build Using GitHub Actions (Recommended for macOS/Linux Users)

This is the easiest way if you're on macOS or Linux:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for release"
   git push origin main
   ```

2. **Go to GitHub Actions:**
   - Visit: `https://github.com/ricardoguimaraes2021/GearLog/actions`
   - Click on "Build Windows Executable" workflow
   - Click "Run workflow" (button on the right)
   - Select branch: `main`
   - Click "Run workflow" (green button)

3. **Wait for the build to complete:**
   - The workflow will build the .exe on a Windows machine
   - Takes about 2-5 minutes

4. **Download the artifact:**
   - Once complete, click on the workflow run
   - Scroll down to "Artifacts"
   - Download `GearLogSetup.exe`

5. **Create a Release:**
   - Follow Step 2 below to create a release
   - Upload the downloaded `GearLogSetup.exe`

**OR** - If you create a version tag, the release will be created automatically:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Option 2: Build on Windows Machine

If you have access to a Windows machine:

### Step 1: Build the Executable

First, make sure you have the .exe file ready:

```bash
# Install build dependencies
pip install -r requirements-build.txt

# Build the executable
python build_exe.py

# Verify the file exists
ls -lh dist/GearLogSetup.exe
```

The executable should be in the `dist/` folder.

### Step 2: Create a GitHub Release

#### Option A: Using GitHub Web Interface (Recommended for first time)

1. **Go to your repository on GitHub:**
   ```
   https://github.com/ricardoguimaraes2021/GearLog
   ```

2. **Click on "Releases"** (on the right sidebar, or go to: `https://github.com/ricardoguimaraes2021/GearLog/releases`)

3. **Click "Draft a new release"** (or "Create a new release")

4. **Fill in the release information:**
   - **Tag version:** Choose a version number (e.g., `v1.0.0` or `v1.0.0-setup`)
     - Click "Choose a tag" → "Create new tag"
     - Enter: `v1.0.0` (or your version)
     - Select: "Create new tag: v1.0.0 on publish"
   
   - **Release title:** `GearLog Setup v1.0.0` (or your version)
   
   - **Description:** Add release notes, for example:
     ```markdown
     ## GearLog Automated Setup v1.0.0
     
     ### What's New
     - Automated setup script for Windows
     - Installs all dependencies automatically
     - Configures backend and frontend
     - Sets up database and runs migrations
     
     ### How to Use
     1. Download `GearLogSetup.exe`
     2. Double-click to run
     3. Follow the on-screen instructions
     
     ### Requirements
     - Windows 10/11
     - Administrator privileges (for installing dependencies)
     ```

5. **Upload the executable:**
   - Scroll down to "Attach binaries"
   - Drag and drop `dist/GearLogSetup.exe` into the upload area
   - OR click "selecting them" and browse to `dist/GearLogSetup.exe`

6. **Publish the release:**
   - Click "Publish release" (green button at the bottom)
   - Wait for the upload to complete

7. **Verify the download link:**
   - After publishing, the release page will show the download link
   - The direct download URL will be:
     ```
     https://github.com/ricardoguimaraes2021/GearLog/releases/download/v1.0.0/GearLogSetup.exe
     ```
   - The "latest" URL (used in the landing page) will be:
     ```
     https://github.com/ricardoguimaraes2021/GearLog/releases/latest/download/GearLogSetup.exe
     ```

#### Option B: Using GitHub CLI (Faster for future releases)

If you have GitHub CLI installed:

```bash
# Install GitHub CLI (if not installed)
# macOS: brew install gh
# Windows: winget install GitHub.cli

# Authenticate
gh auth login

# Create a release and upload the file
gh release create v1.0.0 \
  dist/GearLogSetup.exe \
  --title "GearLog Setup v1.0.0" \
  --notes "Automated setup executable for Windows"
```

### Step 3: Test the Download Link

After publishing, test the download link:

1. **Test the direct link:**
   ```
   https://github.com/ricardoguimaraes2021/GearLog/releases/latest/download/GearLogSetup.exe
   ```

2. **Test from the landing page:**
   - Go to your landing page
   - Click the "Download for Windows (.exe)" button
   - Verify the download starts

### Step 4: Update Release (For Future Versions)

When you need to update the .exe:

1. Build a new version:
   ```bash
   python build_exe.py
   ```

2. Create a new release with a new version tag (e.g., `v1.0.1`)

3. Upload the new `GearLogSetup.exe`

4. The "latest" link will automatically point to the newest release

## Troubleshooting

### "404 Not Found" Error

**Problem:** The download link returns 404.

**Solutions:**
1. **Check the release exists:**
   - Go to: `https://github.com/ricardoguimaraes2021/GearLog/releases`
   - Verify the release is published (not draft)

2. **Check the file name:**
   - The file must be named exactly: `GearLogSetup.exe`
   - Case-sensitive on some systems

3. **Check the tag name:**
   - The URL uses the tag name: `/releases/download/TAG_NAME/GearLogSetup.exe`
   - Make sure the tag exists and matches

4. **Use the correct URL format:**
   - Latest release: `/releases/latest/download/GearLogSetup.exe`
   - Specific version: `/releases/download/v1.0.0/GearLogSetup.exe`

### File Not Uploading

**Problem:** The file upload fails or is slow.

**Solutions:**
1. **Check file size:**
   - GitHub has a 2GB limit per file
   - If larger, consider compression or splitting

2. **Check internet connection:**
   - Large files may take time to upload
   - Use a stable connection

3. **Try GitHub CLI:**
   - Sometimes CLI is more reliable for large files

### "Latest" Link Points to Wrong Version

**Problem:** The `/latest/download/` link doesn't point to the newest release.

**Solutions:**
1. **Check release dates:**
   - GitHub uses the release date, not tag version
   - Make sure the newest release was published most recently

2. **Check for drafts:**
   - Draft releases don't count as "latest"
   - Make sure the release is published

3. **Use specific version URL:**
   - Instead of `/latest/`, use the specific version tag

## Automation (Optional)

You can automate the release process using GitHub Actions. Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r requirements-build.txt
      
      - name: Build executable
        run: python build_exe.py
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/GearLogSetup.exe
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Then, to create a release, just create and push a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Quick Reference

### Direct Download URLs

- **Latest release:**
  ```
  https://github.com/ricardoguimaraes2021/GearLog/releases/latest/download/GearLogSetup.exe
  ```

- **Specific version (replace v1.0.0 with your version):**
  ```
  https://github.com/ricardoguimaraes2021/GearLog/releases/download/v1.0.0/GearLogSetup.exe
  ```

### Release Page

- **View all releases:**
  ```
  https://github.com/ricardoguimaraes2021/GearLog/releases
  ```

- **Create new release:**
  ```
  https://github.com/ricardoguimaraes2021/GearLog/releases/new
  ```

## Summary

1. ✅ Build the .exe: `python build_exe.py`
2. ✅ Go to GitHub Releases page
3. ✅ Click "Draft a new release"
4. ✅ Create a new tag (e.g., `v1.0.0`)
5. ✅ Upload `dist/GearLogSetup.exe`
6. ✅ Write release notes
7. ✅ Click "Publish release"
8. ✅ Test the download link

The landing page will automatically use the latest release!

