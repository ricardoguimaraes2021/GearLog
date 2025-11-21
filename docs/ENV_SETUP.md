# Configuração de Variáveis de Ambiente

Como os ficheiros `.env.example` estão protegidos, segue estas instruções para configurar as variáveis de ambiente.

## 📝 Backend (.env.example)

Cria ou atualiza `backend/.env.example` com o seguinte conteúdo:

```env
# ============================================================================
# GEARLOG - ENVIRONMENT CONFIGURATION
# ============================================================================
# 
# INSTRUÇÕES:
# 1. Copia este ficheiro para .env: cp .env.example .env
# 2. Para LOCAL: Descomenta as variáveis da secção "LOCAL" e comenta as de "PRODUCTION"
# 3. Para PRODUCTION: Descomenta as variáveis da secção "PRODUCTION" e comenta as de "LOCAL"
# 4. Gera a APP_KEY: php artisan key:generate
#
# ============================================================================

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
APP_NAME=GearLog
APP_ENV=local
# APP_ENV=production
APP_KEY=
APP_DEBUG=true
# APP_DEBUG=false
APP_TIMEZONE=UTC
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

# ============================================================================
# APPLICATION URLs
# ============================================================================
# LOCAL - Descomenta estas linhas para desenvolvimento local
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# PRODUCTION - Descomenta estas linhas para produção e substitui pelos teus domínios
# APP_URL=https://api.seudominio.com
# FRONTEND_URL=https://seudominio.com

# ============================================================================
# LOGGING
# ============================================================================
LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug
# LOG_LEVEL=error
LOG_DEPRECATIONS_CHANNEL=null

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
# LOCAL - Descomenta para desenvolvimento local
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gearlog
DB_USERNAME=root
DB_PASSWORD=

# PRODUCTION - Descomenta e configura com as credenciais da tua base de dados de produção
# DB_CONNECTION=mysql
# DB_HOST=your-database-host.com
# DB_PORT=3306
# DB_DATABASE=gearlog_prod
# DB_USERNAME=your_db_user
# DB_PASSWORD=your_secure_password
# DB_SSL_MODE=require
# DB_SSL_CA=/path/to/ca-cert.pem
# DB_TIMEOUT=10

# ============================================================================
# SESSION CONFIGURATION
# ============================================================================
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
# SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
# SESSION_SAME_SITE=strict

# ============================================================================
# CACHE CONFIGURATION
# ============================================================================
# LOCAL - Usa 'file' para desenvolvimento
CACHE_DRIVER=file
# CACHE_STORE=file

# PRODUCTION - Usa 'redis' ou 'database' para produção (recomendado: redis)
# CACHE_DRIVER=redis
# CACHE_STORE=redis

# ============================================================================
# QUEUE CONFIGURATION
# ============================================================================
# LOCAL - Usa 'sync' para desenvolvimento (executa imediatamente)
QUEUE_CONNECTION=sync
# QUEUE_CONNECTION=database
# QUEUE_CONNECTION=redis

# PRODUCTION - Usa 'database' ou 'redis' para produção
# QUEUE_CONNECTION=database
# QUEUE_CONNECTION=redis

# ============================================================================
# REDIS CONFIGURATION (Opcional - apenas se usares Redis)
# ============================================================================
# REDIS_CLIENT=phpredis
# REDIS_HOST=127.0.0.1
# REDIS_PASSWORD=null
# REDIS_PORT=6379
# REDIS_DB=0
# REDIS_CACHE_DB=1

# ============================================================================
# FILESYSTEM CONFIGURATION
# ============================================================================
FILESYSTEM_DISK=local
# FILESYSTEM_DISK=s3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=us-east-1
# AWS_BUCKET=
# AWS_USE_PATH_STYLE_ENDPOINT=false

# ============================================================================
# MAIL CONFIGURATION
# ============================================================================
# LOCAL - Mailtrap para desenvolvimento (gratuito)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@gearlog.local
MAIL_FROM_NAME="${APP_NAME}"

# PRODUCTION - Configura com um serviço de email real (SendGrid, Mailgun, AWS SES, etc.)
# MAIL_MAILER=smtp
# MAIL_HOST=smtp.sendgrid.net
# MAIL_PORT=587
# MAIL_USERNAME=apikey
# MAIL_PASSWORD=your-sendgrid-api-key
# MAIL_ENCRYPTION=tls
# MAIL_FROM_ADDRESS=noreply@seudominio.com
# MAIL_FROM_NAME="${APP_NAME}"

# ============================================================================
# BROADCASTING / PUSHER CONFIGURATION
# ============================================================================
# LOCAL - Descomenta e configura com as tuas credenciais do Pusher
BROADCAST_DRIVER=log
# BROADCAST_DRIVER=pusher
# PUSHER_APP_ID=your-pusher-app-id
# PUSHER_APP_KEY=your-pusher-app-key
# PUSHER_APP_SECRET=your-pusher-app-secret
# PUSHER_APP_CLUSTER=mt1
# PUSHER_HOST=
# PUSHER_PORT=443
# PUSHER_SCHEME=https

# PRODUCTION - Usa as mesmas credenciais do Pusher
# BROADCAST_DRIVER=pusher
# PUSHER_APP_ID=your-pusher-app-id
# PUSHER_APP_KEY=your-pusher-app-key
# PUSHER_APP_SECRET=your-pusher-app-secret
# PUSHER_APP_CLUSTER=mt1
# PUSHER_HOST=
# PUSHER_PORT=443
# PUSHER_SCHEME=https

# ============================================================================
# SANCTUM AUTHENTICATION
# ============================================================================
# LOCAL - Domínios permitidos para desenvolvimento
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1

# PRODUCTION - Adiciona os teus domínios de produção (separados por vírgula)
# SANCTUM_STATEFUL_DOMAINS=seudominio.com,www.seudominio.com,api.seudominio.com

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
# LOCAL - Descomenta para desenvolvimento
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# PRODUCTION - Adiciona apenas os teus domínios de produção (separados por vírgula)
# CORS_ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# ============================================================================
# SUPER ADMIN CONFIGURATION
# ============================================================================
# Emails dos super admins (separados por vírgula)
# Estes utilizadores terão acesso ao painel de administração global
SUPER_ADMIN_EMAILS=admin@gearlog.local
# SUPER_ADMIN_EMAILS=admin@seudominio.com,your-email@example.com

# ============================================================================
# API DOCUMENTATION (L5-Swagger)
# ============================================================================
L5_SWAGGER_GENERATE_ALWAYS=false
L5_SWAGGER_USE_ABSOLUTE_PATH=true

# ============================================================================
# MAINTENANCE MODE
# ============================================================================
APP_MAINTENANCE_DRIVER=file
APP_MAINTENANCE_STORE=database

# ============================================================================
# SECURITY NOTES
# ============================================================================
# 1. NUNCA commites o ficheiro .env para o Git
# 2. Em produção, define APP_DEBUG=false
# 3. Em produção, usa passwords fortes para a base de dados
# 4. Em produção, configura SSL para a base de dados (DB_SSL_MODE=require)
# 5. Em produção, usa SESSION_SECURE_COOKIE=true
# 6. Em produção, configura CORS apenas com os teus domínios
# 7. Gera uma APP_KEY única: php artisan key:generate
```

## 📝 Frontend (.env.example)

Cria ou atualiza `frontend/.env.example` com o seguinte conteúdo:

```env
# ============================================================================
# GEARLOG FRONTEND - ENVIRONMENT CONFIGURATION
# ============================================================================
# 
# INSTRUÇÕES:
# 1. Copia este ficheiro para .env: cp .env.example .env
# 2. Para LOCAL: Descomenta as variáveis da secção "LOCAL" e comenta as de "PRODUCTION"
# 3. Para PRODUCTION: Descomenta as variáveis da secção "PRODUCTION" e comenta as de "LOCAL"
# 4. Após alterar, faz rebuild: npm run build
#
# ============================================================================

# ============================================================================
# API URL CONFIGURATION
# ============================================================================
# LOCAL - Descomenta para desenvolvimento local
VITE_API_URL=http://localhost:8000/api/v1

# PRODUCTION - Descomenta e substitui pelo URL da tua API de produção
# VITE_API_URL=https://api.seudominio.com/api/v1

# ============================================================================
# PUSHER CONFIGURATION (Para notificações em tempo real)
# ============================================================================
# LOCAL - Descomenta e configura com as tuas credenciais do Pusher
# VITE_PUSHER_APP_KEY=your-pusher-app-key
# VITE_PUSHER_APP_CLUSTER=mt1

# PRODUCTION - Usa as mesmas credenciais do Pusher
# VITE_PUSHER_APP_KEY=your-pusher-app-key
# VITE_PUSHER_APP_CLUSTER=mt1

# ============================================================================
# NOTES
# ============================================================================
# 1. Estas variáveis são injetadas no build através do Vite
# 2. Após alterar, deves fazer rebuild: npm run build
# 3. Em produção, certifica-te que o VITE_API_URL aponta para HTTPS
# 4. O VITE_PUSHER_APP_KEY deve ser a mesma chave pública do Pusher
```

## 🎯 Como Usar

### Para Desenvolvimento Local

1. Copia os ficheiros:
   ```bash
   cd backend
   cp .env.example .env
   
   cd ../frontend
   cp .env.example .env
   ```

2. Deixa as variáveis de LOCAL descomentadas e comenta as de PRODUCTION

3. Configura as credenciais locais (base de dados, Mailtrap, etc.)

### Para Produção

1. Nos serviços de hospedagem (Railway, Netlify, etc.), adiciona as variáveis de ambiente

2. Descomenta as variáveis de PRODUCTION e comenta as de LOCAL

3. Substitui `seudominio.com` pelos teus domínios reais

## ⚠️ Importante

- **NUNCA** commites o ficheiro `.env` para o Git
- Em produção, sempre usa `APP_DEBUG=false`
- Em produção, sempre usa HTTPS (não HTTP)
- Gera uma `APP_KEY` única para produção: `php artisan key:generate`
