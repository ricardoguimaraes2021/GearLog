# Correção de Configuração de Ambiente (CORS & Cookies)

## 1. Variáveis para o Netlify (Frontend)

No painel do Netlify, em **Site configuration > Environment variables**, adicione:

```ini
VITE_API_URL=https://gearlog-production.up.railway.app/api/v1
```

*Nota: Se usares Pusher, adiciona também as variáveis `VITE_PUSHER_...`.*

## 2. Correção das Variáveis no Railway (Backend)

O erro de CORS e problemas de autenticação (419/401) ocorrem frequentemente devido à configuração incorreta de cookies em ambientes Cross-Domain (Frontend no Netlify e Backend no Railway).

Atualiza as seguintes variáveis no Railway:

| Variável | Valor Atual (Incorreto) | Novo Valor (Correto) | Explicação |
|----------|-------------------------|----------------------|------------|
| `SESSION_DOMAIN` | `gearlog.netlify.app` | `null` (ou remove a variável) | **CRÍTICO:** O backend não pode definir cookies para o domínio do frontend. Deixa vazio para usar o domínio do backend automaticamente. |
| `SESSION_SECURE_COOKIE` | (não definida) | `true` | Necessário para cookies `SameSite=None`. |
| `SESSION_SAME_SITE` | (não definida) | `none` | Necessário para permitir cookies entre domínios diferentes (Netlify -> Railway). |
| `CORS_ALLOWED_ORIGINS` | `https://gearlog.netlify.app` | `https://gearlog.netlify.app` | Mantém assim (sem barra no final). |

**Resumo das variáveis a adicionar/alterar no Railway:**

```ini
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
```
*(Para `SESSION_DOMAIN`, podes simplesmente apagar a variável ou deixá-la em branco).*

## 3. Correção Crítica: Ficheiros de Configuração em Falta

Detetei que vários ficheiros de configuração essenciais do Laravel (`config/session.php`, `config/auth.php`, `config/logging.php`, etc.) estavam em falta no projeto. Isso causava o erro "Application failed to respond" (502 Bad Gateway) no Railway, pois a aplicação não conseguia iniciar corretamente.

**Já restaurei estes ficheiros.** Ao fazeres o próximo deploy (que será automático após eu enviar para o GitHub), o backend deve voltar a funcionar.

## 4. Limpar Cache no Railway

Após o deploy terminar com sucesso, abre este link no navegador para garantir que a cache está limpa:
   
👉 **[https://gearlog-production.up.railway.app/clear-cache-force](https://gearlog-production.up.railway.app/clear-cache-force)**

Se vires a mensagem `Cache cleared successfully!`, a cache foi limpa e o sistema deve estar operacional.
