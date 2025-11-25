# Correção de Configuração de Ambiente (CORS & Cookies)

## ⚠️ IMPORTANTE: Variáveis Duplicadas no Railway

**REMOVE a variável duplicada:**
- `SESSION_SECURE_COOKIE`` (com acento grave no final) - **APAGA ESTA**

Mantém apenas:
- `SESSION_SECURE_COOKIE=true` (sem acento grave)

## 1. Variáveis para o Netlify (Frontend)

No painel do Netlify, em **Site configuration > Environment variables**, adiciona:

```ini
VITE_API_URL=https://gearlog-production.up.railway.app/api/v1
```

## 2. Variáveis Corretas no Railway (Backend)

Estas são as variáveis que devem estar configuradas no Railway:

### ✅ Variáveis Corretas (já tens):
```ini
APP_URL=https://gearlog-production.up.railway.app
CORS_ALLOWED_ORIGINS=https://gearlog.netlify.app
FRONTEND_URL=https://gearlog.netlify.app
SANCTUM_STATEFUL_DOMAINS=gearlog.netlify.app,gearlog-production.up.railway.app
SESSION_DOMAIN=
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_SAME_SITE=none
SESSION_SECURE_COOKIE=true
```

### ❌ Remove esta variável duplicada:
```ini
SESSION_SECURE_COOKIE`=true   # <-- APAGA (tem acento grave no final)
```

## 3. Melhorias no Dockerfile

Atualizei o Dockerfile para:
- Limpar a cache automaticamente no startup (importante porque as variáveis de ambiente podem mudar no Railway)
- Adicionar logs detalhados para facilitar o debug
- Verificar a configuração antes de iniciar o servidor

## 4. Próximos Passos

1. **No Railway:**
   - Remove a variável `SESSION_SECURE_COOKIE`` (com acento grave)
   - Verifica que todas as outras variáveis estão corretas

2. **Aguarda o Deploy:**
   - O Railway vai fazer deploy automaticamente após eu enviar as alterações
   - Verifica os logs do Railway para ver se há erros

3. **Testa o Endpoint:**
   - Após o deploy, testa: `https://gearlog-production.up.railway.app/health`
   - Se funcionar, testa: `https://gearlog-production.up.railway.app/clear-cache-force`

## Explicação Técnica

O erro 502 (Bad Gateway) significa que o Railway não consegue conectar-se à aplicação. Isto pode acontecer por:

1. **Ficheiros de configuração em falta** ✅ (já corrigido)
2. **Variáveis de ambiente inválidas** ⚠️ (tens uma duplicada)
3. **Erro no startup da aplicação** - Os novos logs vão ajudar a identificar

Com os logs melhorados no Dockerfile, vais conseguir ver exatamente onde está a falhar nos logs do Railway.
