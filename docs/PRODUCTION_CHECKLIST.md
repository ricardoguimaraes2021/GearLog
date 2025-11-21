# Checklist de Produção - GearLog

Use este checklist antes e depois do deployment para garantir que tudo está configurado corretamente.

## ✅ Pré-Deployment

### Código
- [ ] Todas as migrations executadas localmente
- [ ] Build do frontend testado localmente (`npm run build`)
- [ ] Nenhum erro no console do browser
- [ ] Nenhum erro nos logs do Laravel
- [ ] Todas as funcionalidades testadas localmente

### Configuração Backend
- [ ] `APP_ENV=production` no `.env`
- [ ] `APP_DEBUG=false` no `.env`
- [ ] `APP_KEY` gerado e configurado
- [ ] `APP_URL` configurado com HTTPS
- [ ] `FRONTEND_URL` configurado com HTTPS
- [ ] Base de dados configurada
- [ ] `SANCTUM_STATEFUL_DOMAINS` inclui domínio de produção
- [ ] `CORS_ALLOWED_ORIGINS` inclui apenas domínios de produção
- [ ] Email configurado (SendGrid/Mailgun/etc.)
- [ ] Pusher configurado
- [ ] `SUPER_ADMIN_EMAILS` configurado
- [ ] `SESSION_SECURE_COOKIE=true` em produção
- [ ] `SESSION_SAME_SITE=strict` em produção

### Configuração Frontend
- [ ] `VITE_API_URL` configurado com HTTPS
- [ ] `VITE_PUSHER_APP_KEY` configurado
- [ ] `VITE_PUSHER_APP_CLUSTER` configurado
- [ ] Build testado localmente
- [ ] `netlify.toml` ou `_redirects` configurado

### Segurança
- [ ] Passwords fortes para base de dados
- [ ] `APP_KEY` único e seguro
- [ ] SSL/HTTPS configurado (automático na maioria das plataformas)
- [ ] CORS configurado apenas com domínios permitidos
- [ ] Rate limiting ativo
- [ ] Super admin emails configurados

## 🚀 Deployment

### Backend
- [ ] Serviço criado no Railway/Render/VPS
- [ ] Base de dados criada
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado com sucesso
- [ ] Migrations executadas
- [ ] Storage link criado (`php artisan storage:link`)
- [ ] Health check funcionando (`/up`)

### Frontend
- [ ] Site criado no Netlify/Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] Redirects configurados (para React Router)
- [ ] Deploy executado com sucesso

### Domínio
- [ ] Domínio comprado/configurado
- [ ] DNS configurado
- [ ] SSL ativo (verificar cadeado no browser)
- [ ] Backend acessível via `api.seudominio.com`
- [ ] Frontend acessível via `seudominio.com`

## 🔍 Pós-Deployment

### Verificações Básicas
- [ ] Health check responde: `https://api.seudominio.com/up`
- [ ] Frontend carrega: `https://seudominio.com`
- [ ] Sem erros no console do browser
- [ ] Sem erros nos logs do backend

### Autenticação
- [ ] Página de login carrega
- [ ] Login funciona com credenciais válidas
- [ ] Token é guardado corretamente
- [ ] Logout funciona
- [ ] Sessão persiste após refresh

### API
- [ ] Chamadas à API funcionam (verificar Network tab)
- [ ] Sem erros CORS
- [ ] Sem erros 401/403
- [ ] Respostas da API corretas

### Funcionalidades Principais
- [ ] Dashboard carrega
- [ ] Lista de produtos funciona
- [ ] Criar/editar produto funciona
- [ ] Lista de tickets funciona
- [ ] Criar/editar ticket funciona
- [ ] Upload de ficheiros funciona
- [ ] Export funciona (CSV/Excel/PDF)

### Notificações
- [ ] Notificações em tempo real funcionam
- [ ] Pusher conectado (verificar console)
- [ ] Notificações aparecem quando criadas

### Email
- [ ] Reset de password funciona
- [ ] Email de reset é recebido
- [ ] Link de reset funciona

### Performance
- [ ] Página inicial carrega em < 3 segundos
- [ ] API responde em < 500ms
- [ ] Imagens carregam corretamente
- [ ] Sem erros de recursos não encontrados

## 🔒 Segurança

### Verificações
- [ ] HTTPS ativo (verificar cadeado no browser)
- [ ] Sem avisos de segurança no browser
- [ ] Cookies marcados como Secure
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Passwords fortes obrigatórias
- [ ] Super admin protegido

### Headers de Segurança
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security` (HSTS)

## 📊 Monitorização

### Logs
- [ ] Logs do backend acessíveis
- [ ] Logs do frontend acessíveis (se aplicável)
- [ ] Erros são logados corretamente

### Health Checks
- [ ] Health check endpoint funcionando
- [ ] Monitorização configurada (opcional)

### Backups
- [ ] Backups automáticos configurados
- [ ] Backups testados (restore testado)

## 🐛 Troubleshooting

Se algo não funcionar:

1. **Verifica os logs:**
   - Backend: Railway/Render logs
   - Frontend: Netlify/Vercel logs
   - Browser: Console e Network tab

2. **Verifica variáveis de ambiente:**
   - Todas configuradas?
   - Valores corretos?
   - HTTPS nos URLs?

3. **Verifica CORS:**
   - `CORS_ALLOWED_ORIGINS` inclui o domínio do frontend?
   - `SANCTUM_STATEFUL_DOMAINS` inclui o domínio do frontend?

4. **Verifica SSL:**
   - Ambos os domínios têm SSL ativo?
   - Certificados válidos?

5. **Verifica build:**
   - Build do frontend executado com sucesso?
   - Variáveis `VITE_*` injetadas corretamente?

## 📝 Notas

- Marca cada item como concluído à medida que verificas
- Se algo falhar, anota o erro e investiga
- Mantém este checklist atualizado com novas verificações

## 🎯 Próximos Passos Após Deployment

1. Monitorizar logs nas primeiras 24h
2. Testar todas as funcionalidades com utilizadores reais
3. Configurar alertas (opcional)
4. Configurar analytics (opcional)
5. Documentar procedimentos de manutenção

