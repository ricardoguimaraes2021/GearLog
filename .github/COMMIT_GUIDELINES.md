# Commit Guidelines for GearLog

## 🔄 Automatic Commits

After each feature or update, changes will be automatically committed with descriptive messages.

## 📝 Commit Message Format

Commits follow this format:
```
[Type]: Brief description

- Feature/change details
- Additional context if needed
```

## 🔒 Security Checklist

Before committing, ensure:
- ✅ No `.env` files are included
- ✅ No API keys or secrets in code
- ✅ No database passwords
- ✅ No personal access tokens
- ✅ Lock files (composer.lock, package-lock.json) are included (this is correct)

## 🚀 Push Workflow

After authentication is set up:
1. Changes are made
2. Files are staged: `git add .`
3. Commit is created with descriptive message
4. Push to GitHub: `git push origin main`

## 📋 Current Status

- ✅ Repository initialized
- ✅ Initial commit created (71 files)
- ✅ Remote configured: https://github.com/ricardoguimaraes2021/GearLog.git
- ⏳ Authentication pending (see GIT_SETUP.md)

