# Guia de Deployment - Netlify (Frontend)

Este guia explica passo a passo como fazer deploy do frontend GearLog no Netlify.

## 📋 Pré-requisitos

- Conta no GitHub (gratuita)
- Conta no Netlify (gratuita)
- Backend já deployado (Railway ou outro)
- Node.js instalado localmente (para build)

## 🚀 Passo 1: Criar Conta no Netlify

1. Acede a [netlify.com](https://www.netlify.com)
2. Clica em "Sign up"
3. Regista-te com GitHub (recomendado)
4. Aceita o plano gratuito

## 🔨 Passo 2: Preparar Build Local (Recomendado)

Antes de fazer deploy, testa o build localmente:

1. Abre o terminal na pasta `frontend`
2. Cria o ficheiro `.env`:
```bash
cp .env.example .env
```

3. Edita `.env` com as variáveis de produção:
```env
VITE_API_URL=https://seu-backend.railway.app/api/v1
VITE_PUSHER_APP_KEY=your-pusher-app-key
VITE_PUSHER_APP_CLUSTER=mt1
```

4. Instala dependências e faz build:
```bash
npm install
npm run build
```

5. Testa o build localmente:
```bash
npm run preview
```

6. Se funcionar, está pronto para deploy!

## 🌐 Passo 3: Deploy via GitHub (Recomendado)

### Opção A: Deploy Automático (Recomendado)

1. No Netlify, clica em "Add new site" → "Import an existing project"
2. Seleciona "GitHub"
3. Autoriza o Netlify a aceder ao teu GitHub
4. Seleciona o repositório GearLog
5. Configura o build:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

6. Clica em "Show advanced" e adiciona variáveis de ambiente:
   - `VITE_API_URL` = `https://seu-backend.railway.app/api/v1`
   - `VITE_PUSHER_APP_KEY` = `your-pusher-app-key`
   - `VITE_PUSHER_APP_CLUSTER` = `mt1`

7. Clica em "Deploy site"
8. O Netlify faz build e deploy automaticamente!

### Opção B: Deploy Manual (Drag & Drop)

1. Faz build local (Passo 2)
2. No Netlify, clica em "Add new site" → "Deploy manually"
3. Arrasta a pasta `frontend/dist` para a área de deploy
4. O Netlify faz upload e deploy!

**Nota:** Com esta opção, tens de fazer build manualmente sempre que atualizares.

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

No Netlify, vai ao teu site → "Site settings" → "Environment variables":

### Variáveis Essenciais

```env
VITE_API_URL=https://seu-backend.railway.app/api/v1
VITE_PUSHER_APP_KEY=your-pusher-app-key
VITE_PUSHER_APP_CLUSTER=mt1
```

**Importante:** 
- Estas variáveis são injetadas durante o build
- Se alterares, deves fazer "Trigger deploy" → "Clear cache and deploy site"

## 🔗 Passo 5: Configurar Domínio Personalizado

1. No Netlify, vai ao teu site → "Site settings" → "Domain management"
2. Clica em "Add custom domain"
3. Adiciona o teu domínio (ex: `seudominio.com`)
4. Configura o DNS conforme instruções do Netlify:
   - **Opção A:** Usa os nameservers do Netlify (mais fácil)
   - **Opção B:** Adiciona registos A/CNAME no teu DNS

5. SSL é automático e gratuito! 🎉

## 🔄 Passo 6: Configurar Deploy Automático

Se usaste a Opção A (GitHub), o deploy automático já está configurado!

1. Sempre que fizeres push para a branch `main`, o Netlify faz deploy automaticamente
2. Podes configurar branch específica em "Site settings" → "Build & deploy" → "Continuous Deployment"

### Branch Deploys

- **Production:** Deploy automático da branch `main`
- **Preview:** Deploy automático de pull requests (opcional)

## 🛠️ Passo 7: Configurar Redirects (Importante!)

O React Router precisa de redirects para funcionar corretamente.

1. No Netlify, vai ao teu site → "Site settings" → "File management"
2. Cria/edita o ficheiro `frontend/public/_redirects`:
```
/*    /index.html   200
```

**OU** cria `netlify.toml` na raiz do projeto `frontend`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## ✅ Passo 8: Verificar Deployment

1. Acede ao URL do Netlify (ex: `https://seu-site.netlify.app`)
2. Deves ver a aplicação GearLog
3. Testa o login e outras funcionalidades
4. Verifica se as chamadas à API funcionam (abre DevTools → Network)

## 🔍 Troubleshooting

### Erro: "API calls failing"
- Verifica se `VITE_API_URL` está correto
- Verifica se o backend permite CORS do domínio do Netlify
- Verifica se `SANCTUM_STATEFUL_DOMAINS` inclui o domínio do Netlify

### Erro: "404 on page refresh"
- Adiciona o ficheiro `_redirects` ou `netlify.toml` (Passo 7)
- Faz redeploy após adicionar

### Erro: "Build failed"
- Verifica os logs do build no Netlify
- Testa o build localmente primeiro
- Verifica se todas as dependências estão no `package.json`

### Erro: "Environment variables not working"
- Variáveis `VITE_*` são injetadas durante o build
- Se alterares, deves fazer "Clear cache and deploy site"
- Verifica se o nome da variável começa com `VITE_`

### Erro: "Pusher not working"
- Verifica se `VITE_PUSHER_APP_KEY` está correto
- Verifica se o backend tem `PUSHER_APP_KEY` configurado
- Verifica se `BROADCAST_DRIVER=pusher` no backend

## 💰 Custos

- **Plano Gratuito:** Ilimitado (com algumas limitações)
- **Build minutes:** 300 minutos/mês (gratuito)
- **Bandwidth:** 100GB/mês (gratuito)
- **SSL:** Gratuito e automático
- **Total:** **GRATUITO** para começar! 🎉

## 📚 Próximos Passos

1. Configura domínio personalizado
2. Configura analytics (opcional)
3. Configura form handling (se necessário)
4. Configura preview deployments para PRs

## 🔗 Links Úteis

- [Netlify Docs](https://docs.netlify.com)
- [Netlify Build Settings](https://docs.netlify.com/configure-builds/overview/)
- [Netlify Redirects](https://docs.netlify.com/routing/redirects/)
- [Netlify Pricing](https://www.netlify.com/pricing/)

## 💡 Dicas

1. **Cache:** O Netlify cacheia automaticamente. Se tiveres problemas, faz "Clear cache and deploy"
2. **Preview Deploys:** Ativa preview deployments para testar antes de fazer merge
3. **Analytics:** Podes ativar analytics básico no plano gratuito
4. **Forms:** O Netlify tem form handling gratuito (se precisares no futuro)
