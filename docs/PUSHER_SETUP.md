# Configuração do Pusher para Notificações em Tempo Real

Este guia explica como configurar o Pusher para ativar notificações em tempo real no GearLog.

## 📋 Pré-requisitos

- Conta no Pusher (gratuita disponível)
- Acesso aos ficheiros `.env` do backend e frontend

## 🚀 Passos para Configurar

### Passo 1: Criar Conta no Pusher

1. Aceda a [https://pusher.com](https://pusher.com)
2. Clique em **"Sign Up"** ou **"Get Started"**
3. Crie uma conta gratuita (tier gratuito permite até 200,000 mensagens/dia)
4. Confirme o email e faça login no dashboard

### Passo 2: Criar uma App no Pusher

1. No dashboard do Pusher, clique em **"Create app"** ou vá para **"Channels"**
2. Preencha o formulário:
   - **App name**: `GearLog` (ou qualquer nome que prefira)
   - **Cluster**: Escolha o cluster mais próximo dos seus utilizadores:
     - `eu` - Europa (recomendado para Portugal)
     - `us` - Estados Unidos
     - `ap` - Ásia-Pacífico
     - `mt1` - Outras regiões
   - **Front-end tech**: Pode escolher `Laravel` ou qualquer outro
   - **Back-end tech**: Pode escolher `Laravel` ou qualquer outro
3. Clique em **"Create app"**

### Passo 3: Obter Credenciais

1. Após criar a app, vá para a secção **"App Keys"** no dashboard
2. Copie os seguintes valores (você precisará deles):
   - **App ID** (ex: `1234567`)
   - **Key** (ex: `abc123def456ghi789`)
   - **Secret** (ex: `xyz789secretkey123`)
   - **Cluster** (ex: `eu`, `us`, `ap`)

### Passo 4: Configurar Backend (.env)

Edite o ficheiro `backend/.env` e adicione/atualize as seguintes linhas:

```env
# Mudar de 'log' para 'pusher' para ativar
BROADCAST_DRIVER=pusher

# Credenciais do Pusher (obtidas no Passo 3)
PUSHER_APP_ID=1234567
PUSHER_APP_KEY=abc123def456ghi789
PUSHER_APP_SECRET=xyz789secretkey123
PUSHER_APP_CLUSTER=eu
PUSHER_SCHEME=https
PUSHER_PORT=443
```

**⚠️ IMPORTANTE:**
- Substitua os valores acima pelos seus próprios valores do Pusher
- Não partilhe nunca o `PUSHER_APP_SECRET` publicamente
- O `.env` não deve ser commitado no Git

### Passo 5: Configurar Frontend (.env)

Crie ou edite o ficheiro `frontend/.env` ou `frontend/.env.local` e adicione:

```env
# Chave do Pusher (a mesma KEY do backend)
VITE_PUSHER_APP_KEY=abc123def456ghi789

# Cluster do Pusher (o mesmo do backend)
VITE_PUSHER_APP_CLUSTER=eu

# URL da API (se ainda não estiver configurada)
VITE_API_URL=http://localhost:8000/api/v1
```

**⚠️ IMPORTANTE:**
- O frontend só precisa da `KEY` e do `CLUSTER` (não precisa do SECRET)
- O `.env` do frontend será incluído no bundle, então pode ser público

### Passo 6: Reiniciar Servidores

Para que as alterações tenham efeito, precisa reiniciar os servidores:

1. **Backend (Laravel)**:
   ```bash
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   cd backend
   php artisan serve
   ```

2. **Frontend (Vite)**:
   ```bash
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   cd frontend
   npm run dev
   ```

### Passo 7: Verificar Configuração

1. Abra a aplicação no browser
2. Faça login
3. Abra o **Console do Browser** (F12 → Console)
4. Deve ver uma mensagem de sucesso ou uma conexão WebSocket
5. Para testar:
   - Crie um ticket (se tiver permissões)
   - Ou use o endpoint de teste: `POST /api/v1/notifications/test`

## ✅ Funcionalidades Ativadas

Com o Pusher configurado, as seguintes funcionalidades estarão ativas:

- ✅ **Notificações em tempo real** - Aparecem instantaneamente sem refresh
- ✅ **Toasts automáticos** - Pop-ups quando recebe notificações
- ✅ **Badge atualizado** - Contador de não lidas atualiza automaticamente
- ✅ **Eventos de tickets** - Notificações quando tickets são criados, atribuídos, comentados, etc.

## ❌ Sem Pusher (Modo Fallback)

Se o Pusher não estiver configurado:

- ✅ Notificações são **guardadas na base de dados**
- ✅ Pode ver notificações ao clicar no sino
- ✅ Badge mostra contagem de não lidas (após refresh)
- ❌ **Sem atualização em tempo real** (precisa fazer refresh)
- ❌ **Sem toasts automáticos**

## 🔧 Troubleshooting

### Problema: Notificações não aparecem em tempo real

**Soluções:**
1. Verifique se `BROADCAST_DRIVER=pusher` no backend/.env
2. Verifique se `VITE_PUSHER_APP_KEY` está configurado no frontend/.env
3. Reinicie ambos os servidores
4. Verifique o Console do Browser para erros
5. Verifique se as credenciais estão corretas

### Problema: Erro "Pusher APP_KEY not configured"

**Solução:**
- Adicione `VITE_PUSHER_APP_KEY` ao ficheiro `frontend/.env` ou `frontend/.env.local`
- Reinicie o servidor Vite

### Problema: Conexão WebSocket falha

**Soluções:**
1. Verifique se o cluster está correto (deve corresponder ao escolhido no Pusher)
2. Verifique se há firewall bloqueando conexões WebSocket
3. Verifique se está a usar HTTPS em produção (Pusher requer HTTPS/TLS)

### Problema: Erro de autenticação

**Soluções:**
1. Verifique se o `PUSHER_APP_SECRET` está correto no backend/.env
2. Verifique se a rota `/broadcasting/auth` está acessível
3. Verifique se o token de autenticação está válido

## 📊 Monitorização

No dashboard do Pusher, pode:
- Ver estatísticas de mensagens enviadas
- Ver conexões ativas
- Ver logs de eventos
- Ver uso da quota (gratuita = 200k mensagens/dia)

## 🔒 Segurança

- ⚠️ **NUNCA** partilhe o `PUSHER_APP_SECRET` publicamente
- ⚠️ O `.env` do backend não deve ser commitado no Git
- ✅ O `VITE_PUSHER_APP_KEY` pode ser público (está no código do frontend)
- ✅ Os canais são privados e autenticados via Laravel Sanctum

## 💡 Dicas

- O tier gratuito do Pusher permite **200,000 mensagens por dia** (suficiente para a maioria dos casos)
- Para produção, considere o tier pago para limites maiores e suporte prioritário
- Escolha o cluster mais próximo dos seus utilizadores para melhor latência
- Pode criar múltiplas apps Pusher para ambientes diferentes (desenvolvimento, produção)

## 📞 Suporte

- Documentação Pusher: https://pusher.com/docs
- Laravel Broadcasting: https://laravel.com/docs/broadcasting
- Problemas? Verifique os logs em `backend/storage/logs/laravel.log`

