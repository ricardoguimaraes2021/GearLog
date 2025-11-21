# 🚀 Guia Rápido de Deployment - GearLog

Este é um guia rápido para fazer deploy do GearLog. Para guias detalhados, consulta a pasta `docs/`.

## ⚡ Quick Start

### 1. Escolher Hospedagem

**Recomendado para Iniciantes:**
- **Backend:** [Railway.app](https://railway.app) - ~$10-15/mês (ou gratuito com crédito)
- **Frontend:** [Netlify](https://www.netlify.com) - **GRATUITO**
- **Total:** ~$10-15/mês

**Alternativa Gratuita:**
- **Backend:** [Render.com](https://render.com) - Gratuito (com limitações)
- **Frontend:** [Vercel](https://vercel.com) - **GRATUITO**
- **Total:** **GRATUITO**

### 2. Preparar Variáveis de Ambiente

#### Backend (`backend/.env`)
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com
SANCTUM_STATEFUL_DOMAINS=seudominio.com,www.seudominio.com
CORS_ALLOWED_ORIGINS=https://seudominio.com
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://api.seudominio.com/api/v1
VITE_PUSHER_APP_KEY=your-pusher-key
VITE_PUSHER_APP_CLUSTER=mt1
```

### 3. Deploy

1. **Backend:** Segue [DEPLOYMENT_RAILWAY.md](docs/DEPLOYMENT_RAILWAY.md)
2. **Frontend:** Segue [DEPLOYMENT_NETLIFY.md](docs/DEPLOYMENT_NETLIFY.md)
3. **Verificação:** Usa [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## 📚 Guias Completos

- [Guia Geral de Deployment](docs/DEPLOYMENT_GUIDE.md) - Visão geral completa
- [Deploy Backend no Railway](docs/DEPLOYMENT_RAILWAY.md) - Passo a passo detalhado
- [Deploy Frontend no Netlify](docs/DEPLOYMENT_NETLIFY.md) - Passo a passo detalhado
- [Checklist de Produção](docs/PRODUCTION_CHECKLIST.md) - Verificações pós-deployment

## 💡 Dicas

1. **SSL é automático** em Railway, Netlify, Render e Vercel
2. **Domínio:** Podes começar sem domínio (usa os subdomínios gratuitos)
3. **Custo:** Podes começar completamente grátis com Render + Vercel
4. **Backups:** O backend já tem backups automáticos configurados

## 🆘 Precisa de Ajuda?

1. Consulta os guias detalhados em `docs/`
2. Verifica o [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)
3. Consulta a secção de Troubleshooting nos guias

## 🔗 Links Úteis

- [Railway](https://railway.app) - Hospedagem backend
- [Netlify](https://www.netlify.com) - Hospedagem frontend
- [Render](https://render.com) - Alternativa backend
- [Vercel](https://vercel.com) - Alternativa frontend

