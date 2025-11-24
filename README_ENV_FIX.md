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

## 3. Limpar Cache no Railway (Sem Acesso ao Terminal)

Como não tens acesso ao terminal, adicionei uma rota temporária ao código para forçar a limpeza da cache.

1. **Faz o Deploy** das alterações atuais (incluindo o ficheiro `routes/web.php` que acabei de modificar).
2. Após o deploy terminar, abre este link no navegador:
   
   👉 **[https://gearlog-production.up.railway.app/clear-cache-force](https://gearlog-production.up.railway.app/clear-cache-force)**

3. Se vires a mensagem `Cache cleared successfully!`, a cache foi limpa.
4. **IMPORTANTE:** Depois de testares e veres que tudo funciona, remove o bloco de código que adicionei no final de `backend/routes/web.php` e faz deploy novamente, por questões de segurança.

## Explicação Técnica

O erro `No 'Access-Control-Allow-Origin'` pode ser enganador. Muitas vezes acontece quando o backend tenta definir um cookie inválido (devido ao `SESSION_DOMAIN` errado) ou quando o navegador bloqueia o cookie por falta de `SameSite=None; Secure`, fazendo com que a requisição subsequente falhe ou o preflight (OPTIONS) falhe.

Ao definir `SESSION_DOMAIN=gearlog.netlify.app` no backend (que está em `railway.app`), o navegador rejeita o cookie imediatamente, pois `railway.app` não tem permissão para definir cookies para `netlify.app`.
