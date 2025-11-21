# Guia Completo de Deployment - GearLog

Este guia fornece uma visão geral completa de como fazer deploy do GearLog em produção.

## 📋 Visão Geral

O GearLog é uma aplicação full-stack com:
- **Backend:** Laravel 11 (PHP) - API REST
- **Frontend:** React 18 (TypeScript) - SPA
- **Base de Dados:** MySQL 8
- **Notificações:** Pusher (WebSockets)

## 🏗️ Arquitetura Recomendada

### Opção 1: Railway + Netlify (Recomendado para Iniciantes)

- **Backend:** Railway.app
  - Hospedagem Laravel
  - MySQL incluído
  - SSL automático
  - Custo: ~$10-15/mês (ou gratuito com crédito)

- **Frontend:** Netlify
  - Hospedagem estática
  - SSL automático
  - Deploy automático via GitHub
  - Custo: **GRATUITO**

- **Total:** ~$10-15/mês (ou gratuito se não ultrapassares o crédito)

### Opção 2: Render + Vercel

- **Backend:** Render.com
  - Hospedagem Laravel
  - PostgreSQL (pode adaptar para MySQL)
  - SSL automático
  - Custo: Gratuito (com limitações)

- **Frontend:** Vercel
  - Hospedagem estática
  - SSL automático
  - Deploy automático
  - Custo: **GRATUITO**

### Opção 3: VPS (DigitalOcean, Linode, etc.)

- **Servidor:** VPS com Ubuntu
  - Controlo total
  - Podes hospedar tudo no mesmo servidor
  - Requer mais configuração
  - Custo: ~$6-12/mês

## 🚀 Quick Start

### 1. Preparar o Código

1. **Atualizar variáveis de ambiente:**
   - `backend/.env.example` → copia para `backend/.env` e configura
   - `frontend/.env.example` → copia para `frontend/.env` e configura

2. **Testar build local:**
   ```bash
   # Backend
   cd backend
   composer install --no-dev
   php artisan key:generate
   php artisan migrate
   
   # Frontend
   cd frontend
   npm install
   npm run build
   npm run preview
   ```

### 2. Deploy do Backend

Escolhe uma opção:
- [Railway](DEPLOYMENT_RAILWAY.md) - Recomendado
- [Render](DEPLOYMENT_RENDER.md) - Alternativa gratuita
- VPS - Para mais controlo

### 3. Deploy do Frontend

Escolhe uma opção:
- [Netlify](DEPLOYMENT_NETLIFY.md) - Recomendado
- [Vercel](DEPLOYMENT_VERCEL.md) - Alternativa
- Mesmo servidor do backend (se VPS)

### 4. Configurar Domínio

1. Comprar domínio (Namecheap, Cloudflare, etc.) - ~$10/ano
2. Configurar DNS:
   - `api.seudominio.com` → Backend (Railway/Render)
   - `seudominio.com` → Frontend (Netlify/Vercel)
3. SSL é automático em todas as plataformas!

## 📝 Checklist de Pré-Deployment

### Backend
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY` gerado
- [ ] `APP_URL` configurado (HTTPS)
- [ ] `FRONTEND_URL` configurado (HTTPS)
- [ ] Base de dados configurada
- [ ] Migrations executadas
- [ ] `SANCTUM_STATEFUL_DOMAINS` configurado
- [ ] `CORS_ALLOWED_ORIGINS` configurado
- [ ] Email configurado (SendGrid/Mailgun)
- [ ] Pusher configurado
- [ ] `SUPER_ADMIN_EMAILS` configurado

### Frontend
- [ ] `VITE_API_URL` configurado (HTTPS)
- [ ] `VITE_PUSHER_APP_KEY` configurado
- [ ] Build testado localmente
- [ ] `netlify.toml` ou `_redirects` configurado

### Geral
- [ ] Domínio configurado
- [ ] DNS configurado
- [ ] SSL ativo (automático)
- [ ] Health check funcionando (`/up`)
- [ ] Login testado
- [ ] API testada
- [ ] Notificações testadas

## 🔧 Configurações Importantes

### Variáveis de Ambiente Críticas

#### Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com
SANCTUM_STATEFUL_DOMAINS=seudominio.com,www.seudominio.com
CORS_ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.seudominio.com/api/v1
VITE_PUSHER_APP_KEY=your-pusher-key
VITE_PUSHER_APP_CLUSTER=mt1
```

## 🔍 Verificação Pós-Deployment

1. **Health Check:**
   - `https://api.seudominio.com/up` → Deve retornar `{"status":"ok"}`

2. **Frontend:**
   - `https://seudominio.com` → Deve carregar a aplicação

3. **Login:**
   - Testa login com credenciais válidas
   - Verifica se o token é guardado

4. **API:**
   - Abre DevTools → Network
   - Verifica se as chamadas à API funcionam
   - Verifica se não há erros CORS

5. **Notificações:**
   - Testa se as notificações em tempo real funcionam

## 🐛 Troubleshooting Comum

### Erro CORS
- Verifica `CORS_ALLOWED_ORIGINS` no backend
- Verifica `SANCTUM_STATEFUL_DOMAINS` no backend
- Verifica se o frontend está a usar HTTPS

### Erro 401 (Unauthorized)
- Verifica se o token está a ser enviado
- Verifica se `SANCTUM_STATEFUL_DOMAINS` está correto
- Verifica se as cookies estão a ser enviadas

### Erro 419 (CSRF Token)
- Verifica se o frontend está a fazer request para `/sanctum/csrf-cookie`
- Verifica se `SANCTUM_STATEFUL_DOMAINS` está correto

### Build Failed
- Verifica os logs do build
- Testa build localmente primeiro
- Verifica se todas as dependências estão instaladas

## 📚 Guias Detalhados

- [Deploy Backend no Railway](DEPLOYMENT_RAILWAY.md)
- [Deploy Frontend no Netlify](DEPLOYMENT_NETLIFY.md)
- [Configuração de Email](EMAIL_SETUP.md)
- [Configuração de Pusher](PUSHER_SETUP.md)

## 💰 Estimativa de Custos

### Opção 1: Railway + Netlify
- Railway: $10-15/mês (ou gratuito com crédito)
- Netlify: **GRATUITO**
- Domínio: ~$10/ano
- **Total:** ~$10-15/mês

### Opção 2: Render + Vercel
- Render: Gratuito (com limitações)
- Vercel: **GRATUITO**
- Domínio: ~$10/ano
- **Total:** ~$0-5/mês

### Opção 3: VPS
- VPS: $6-12/mês
- Domínio: ~$10/ano
- **Total:** ~$6-12/mês

## 🎯 Próximos Passos

1. Escolhe a opção de hospedagem
2. Segue o guia específico de deployment
3. Configura domínio e DNS
4. Testa todas as funcionalidades
5. Configura monitorização (opcional)
6. Configura backups (já está automático no backend)

## 🔗 Links Úteis

- [Railway](https://railway.app)
- [Netlify](https://www.netlify.com)
- [Render](https://render.com)
- [Vercel](https://vercel.com)
- [Namecheap](https://www.namecheap.com) - Domínios baratos
- [Cloudflare](https://www.cloudflare.com) - DNS e CDN gratuito

