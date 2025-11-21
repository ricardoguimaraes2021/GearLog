# Script para criar ficheiros .env.example
# Executa: .\create-env-examples.ps1

Write-Host "Criando ficheiros .env.example..." -ForegroundColor Green

# Backend .env.example
$backendEnv = @"
# ============================================
# GEARLOG - ENVIRONMENT CONFIGURATION
# ============================================
# 
# INSTRUÇÕES:
# 1. Copia este ficheiro para .env: cp .env.example .env
# 2. Para LOCAL: Descomenta as variáveis marcadas com [LOCAL]
# 3. Para PRODUÇÃO: Descomenta as variáveis marcadas com [PROD]
# 4. Gera a APP_KEY: php artisan key:generate
#
# ============================================

# ============================================
# APPLICATION SETTINGS
# ============================================
APP_NAME=GearLog
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

# [LOCAL] Descomenta para desenvolvimento local
# APP_ENV=local
# APP_DEBUG=true

# Application URLs
# [LOCAL] Descomenta para desenvolvimento local
# APP_URL=http://localhost:8000
# FRONTEND_URL=http://localhost:5173

# [PROD] Descomenta e configura para produção
# APP_URL=https://api.seudominio.com
# FRONTEND_URL=https://seudominio.com

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_CONNECTION=mysql

# [LOCAL] Descomenta para desenvolvimento local
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=gearlog
# DB_USERNAME=root
# DB_PASSWORD=

# [PROD] Descomenta e configura para produção (Railway/Render/etc)
# DB_HOST=your-db-host
# DB_PORT=3306
# DB_DATABASE=gearlog
# DB_USERNAME=your-db-user
# DB_PASSWORD=your-secure-password

# ============================================
# CACHE & SESSION
# ============================================
CACHE_DRIVER=file
SESSION_DRIVER=file
SESSION_LIFETIME=120

# [PROD] Descomenta para usar Redis em produção (recomendado)
# CACHE_DRIVER=redis
# REDIS_HOST=127.0.0.1
# REDIS_PASSWORD=null
# REDIS_PORT=6379

# ============================================
# QUEUE CONFIGURATION
# ============================================
QUEUE_CONNECTION=sync

# ============================================
# BROADCASTING / PUSHER
# ============================================
BROADCAST_DRIVER=pusher

# [LOCAL] Configura com as tuas credenciais do Pusher
# PUSHER_APP_ID=your-pusher-app-id
# PUSHER_APP_KEY=your-pusher-key
# PUSHER_APP_SECRET=your-pusher-secret
# PUSHER_APP_CLUSTER=mt1

# ============================================
# MAIL CONFIGURATION
# ============================================
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@gearlog.local
MAIL_FROM_NAME="${APP_NAME}"

# [LOCAL] Descomenta para usar Mailtrap (desenvolvimento)
# MAIL_HOST=smtp.mailtrap.io
# MAIL_PORT=2525
# MAIL_USERNAME=your-mailtrap-username
# MAIL_PASSWORD=your-mailtrap-password

# [PROD] Descomenta e configura para produção (SendGrid/Mailgun)
# MAIL_HOST=smtp.sendgrid.net
# MAIL_PORT=587
# MAIL_USERNAME=apikey
# MAIL_PASSWORD=your-sendgrid-api-key
# MAIL_FROM_ADDRESS=noreply@seudominio.com

# ============================================
# FILESYSTEM
# ============================================
FILESYSTEM_DISK=local

# ============================================
# SANCTUM (AUTHENTICATION)
# ============================================
# [LOCAL] Descomenta para desenvolvimento local
# SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1

# [PROD] Descomenta e configura com o teu domínio de produção
# SANCTUM_STATEFUL_DOMAINS=seudominio.com,www.seudominio.com,api.seudominio.com

# ============================================
# CORS CONFIGURATION
# ============================================
# [LOCAL] Descomenta para desenvolvimento local
# CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# [PROD] Descomenta e configura com o teu domínio de produção
# CORS_ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# ============================================
# SUPER ADMIN
# ============================================
# [LOCAL] Descomenta e usa o teu email local
# SUPER_ADMIN_EMAILS=admin@admin.com

# [PROD] Descomenta e configura com os emails dos super admins
# SUPER_ADMIN_EMAILS=admin@seudominio.com

# ============================================
# LOGGING
# ============================================
LOG_CHANNEL=stack
LOG_LEVEL=debug

# [PROD] Descomenta para produção (menos verboso)
# LOG_LEVEL=error
"@

# Frontend .env.example
$frontendEnv = @"
# ============================================
# GEARLOG FRONTEND - ENVIRONMENT CONFIGURATION
# ============================================
# 
# INSTRUÇÕES:
# 1. Copia este ficheiro para .env: cp .env.example .env
# 2. Para LOCAL: Descomenta as variáveis marcadas com [LOCAL]
# 3. Para PRODUÇÃO: Descomenta as variáveis marcadas com [PROD]
# 4. As variáveis VITE_* são expostas ao browser (não colocar secrets aqui!)
#
# ============================================

# ============================================
# API URL
# ============================================
# [LOCAL] Descomenta para desenvolvimento local
# VITE_API_URL=http://localhost:8000/api/v1

# [PROD] Descomenta e configura com a URL da API em produção
# VITE_API_URL=https://api.seudominio.com/api/v1

# ============================================
# PUSHER CONFIGURATION
# ============================================
# [LOCAL] Descomenta e configura com as tuas credenciais do Pusher
# VITE_PUSHER_APP_KEY=your-pusher-key
# VITE_PUSHER_APP_CLUSTER=mt1

# [PROD] Usa as mesmas credenciais (ou cria um app separado no Pusher)
# VITE_PUSHER_APP_KEY=your-pusher-key
# VITE_PUSHER_APP_CLUSTER=mt1

# ============================================
# NOTAS IMPORTANTES
# ============================================
# - Todas as variáveis que começam com VITE_ são expostas ao browser
# - NÃO colocar secrets, passwords ou API keys sensíveis aqui
# - Após alterar estas variáveis, é necessário fazer rebuild: npm run build
# - Em desenvolvimento, reinicia o servidor: npm run dev
"@

# Criar ficheiros
try {
    $backendEnv | Out-File -FilePath "backend\.env.example" -Encoding UTF8 -NoNewline
    Write-Host "✓ backend/.env.example criado" -ForegroundColor Green
    
    $frontendEnv | Out-File -FilePath "frontend\.env.example" -Encoding UTF8 -NoNewline
    Write-Host "✓ frontend/.env.example criado" -ForegroundColor Green
    
    Write-Host "`nFicheiros criados com sucesso!" -ForegroundColor Green
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Copia backend/.env.example para backend/.env" -ForegroundColor Cyan
    Write-Host "2. Copia frontend/.env.example para frontend/.env" -ForegroundColor Cyan
    Write-Host "3. Descomenta as variáveis [LOCAL] para desenvolvimento" -ForegroundColor Cyan
    Write-Host "4. Gera APP_KEY: cd backend; php artisan key:generate" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao criar ficheiros: $_" -ForegroundColor Red
}

