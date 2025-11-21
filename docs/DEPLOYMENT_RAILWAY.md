# Guia de Deployment - Railway (Backend)

Este guia explica passo a passo como fazer deploy do backend GearLog no Railway.

## 📋 Pré-requisitos

- Conta no GitHub (gratuita)
- Conta no Railway (gratuita com $5 crédito/mês)
- Projeto GearLog no GitHub

## 🚀 Passo 1: Criar Conta no Railway

1. Acede a [railway.app](https://railway.app)
2. Clica em "Start a New Project"
3. Regista-te com GitHub (recomendado) ou email
4. Aceita o plano gratuito (inclui $5 crédito/mês)

## 🗄️ Passo 2: Criar Base de Dados MySQL

1. No dashboard do Railway, clica em "New Project"
2. Clica em "New" → "Database" → "Add MySQL"
3. Railway cria automaticamente uma base de dados MySQL
4. **Anota as credenciais** que aparecem:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_URL` (connection string completa)

## 🔧 Passo 3: Criar Serviço para o Backend

1. No mesmo projeto, clica em "New" → "GitHub Repo"
2. Seleciona o repositório GearLog
3. Railway detecta automaticamente que é um projeto Laravel
4. Clica em "Deploy Now"

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

No serviço do backend, vai a "Variables" e adiciona:

### Variáveis Essenciais

```env
APP_NAME=GearLog
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=https://seu-backend.railway.app
FRONTEND_URL=https://seu-frontend.netlify.app

# Database (usa as variáveis da base de dados criada)
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_DATABASE=${{MySQL.MYSQL_DATABASE}}
DB_USERNAME=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict

# Cache
CACHE_DRIVER=file
# Ou usa Redis se adicionares: CACHE_DRIVER=redis

# Queue
QUEUE_CONNECTION=sync
# Ou database se precisares: QUEUE_CONNECTION=database

# Mail (configura com SendGrid, Mailgun, etc.)
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@seudominio.com
MAIL_FROM_NAME=GearLog

# Broadcasting (Pusher)
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=your-pusher-app-id
PUSHER_APP_KEY=your-pusher-app-key
PUSHER_APP_SECRET=your-pusher-app-secret
PUSHER_APP_CLUSTER=mt1

# Sanctum
SANCTUM_STATEFUL_DOMAINS=seudominio.com,www.seudominio.com

# CORS
CORS_ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Super Admin
SUPER_ADMIN_EMAILS=admin@seudominio.com

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### Gerar APP_KEY

1. No Railway, vai ao serviço do backend
2. Clica em "Deployments" → "View Logs"
3. Abre o terminal: clica em "Deploy" → "View Logs" → "Shell"
4. Executa: `php artisan key:generate`
5. Copia a `APP_KEY` gerada
6. Volta a "Variables" e cola no `APP_KEY`

**OU** adiciona ao "Deploy Command" (ver passo 5)

## 🛠️ Passo 5: Configurar Build e Deploy

No serviço do backend, vai a "Settings" → "Deploy":

### Build Command
```bash
composer install --no-dev --optimize-autoloader
```

### Start Command
```bash
php artisan migrate --force && php artisan storage:link && php artisan config:cache && php artisan route:cache && php artisan view:cache && php -S 0.0.0.0:$PORT -t public
```

**Nota:** Railway usa a variável `$PORT` automaticamente.

### Health Check Path
```
/up
```

## 🔗 Passo 6: Configurar Domínio Personalizado (Opcional)

1. No serviço do backend, vai a "Settings" → "Networking"
2. Clica em "Generate Domain" (gera um domínio `.railway.app`)
3. Para domínio personalizado:
   - Clica em "Custom Domain"
   - Adiciona o teu domínio (ex: `api.seudominio.com`)
   - Configura o DNS conforme instruções do Railway
   - SSL é automático!

## 📝 Passo 7: Executar Migrations

1. No Railway, vai ao serviço do backend
2. Clica em "Deployments" → "View Logs"
3. Abre o terminal (Shell)
4. Executa:
```bash
php artisan migrate --force
php artisan db:seed --class=SuperAdminSeeder
```

## ✅ Passo 8: Verificar Deployment

1. Acede ao URL do teu backend (ex: `https://seu-backend.railway.app`)
2. Deves ver a resposta do Laravel ou erro 404 (normal se não houver rota `/`)
3. Testa o health check: `https://seu-backend.railway.app/up`
4. Deve retornar: `{"status":"ok"}`

## 🔍 Troubleshooting

### Erro: "APP_KEY not set"
- Gera a chave: `php artisan key:generate` no terminal do Railway
- Copia e cola em "Variables" → `APP_KEY`

### Erro: "Database connection failed"
- Verifica se as variáveis de ambiente da base de dados estão corretas
- Usa `${{MySQL.MYSQL_HOST}}` para referenciar a base de dados criada
- Verifica se a base de dados está no mesmo projeto

### Erro: "Storage link failed"
- O comando `php artisan storage:link` está no Start Command
- Se falhar, executa manualmente no terminal

### Erro: "Migration failed"
- Verifica os logs no Railway
- Executa `php artisan migrate:status` para ver o estado
- Podes executar migrations manualmente no terminal

### Erro: "CORS error"
- Verifica `CORS_ALLOWED_ORIGINS` inclui o domínio do frontend
- Verifica `FRONTEND_URL` está correto
- Verifica `SANCTUM_STATEFUL_DOMAINS` inclui o domínio do frontend

## 💰 Custos

- **Plano Gratuito:** $5 crédito/mês
- **Backend Laravel:** ~$5-10/mês (depende do uso)
- **MySQL:** ~$5/mês (plano básico)
- **Total estimado:** $10-15/mês (pode ser gratuito se não ultrapassares o crédito)

## 📚 Próximos Passos

1. Configura o frontend no Netlify (ver `DEPLOYMENT_NETLIFY.md`)
2. Configura email para produção (SendGrid/Mailgun)
3. Configura domínio personalizado
4. Configura backups automáticos

## 🔗 Links Úteis

- [Railway Docs](https://docs.railway.app)
- [Laravel on Railway](https://docs.railway.app/guides/laravel)
- [Railway Pricing](https://railway.app/pricing)
