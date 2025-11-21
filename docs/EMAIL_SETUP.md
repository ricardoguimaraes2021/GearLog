# Configuração de Email para Reset de Password

## Como Funciona

Quando um utilizador solicita um reset de password:

1. O utilizador preenche o email na página "Forgot Password"
2. O backend cria um token único e temporário (válido por 60 minutos)
3. O Laravel envia um email usando a `ResetPasswordNotification`
4. O email contém um link para `/reset-password?token=XXX&email=YYY`
5. O utilizador clica no link e define uma nova password

## Configuração

### 1. Configuração no `.env`

Adiciona estas variáveis ao teu ficheiro `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@gearlog.local
MAIL_FROM_NAME="GearLog"
```

### 2. Opções de Configuração

#### Desenvolvimento Local (Mailtrap - Recomendado)

Mailtrap é um serviço gratuito para testar emails em desenvolvimento:

1. Regista-te em https://mailtrap.io
2. Cria uma inbox (sandbox)
3. Copia as credenciais SMTP
4. Configura no `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@gearlog.local
MAIL_FROM_NAME="GearLog"
```

⚠️ **IMPORTANTE**: O Mailtrap sandbox NÃO envia emails reais! Os emails ficam apenas na inbox de testes do Mailtrap (https://mailtrap.io). Isto é perfeito para desenvolvimento e testes, mas para produção deves usar um dos serviços abaixo.

#### Apenas Logs (Desenvolvimento)

Para desenvolvimento sem enviar emails reais:

```env
MAIL_MAILER=log
```

Os emails serão registados em `storage/logs/laravel.log`

#### Produção (Serviços Reais)

⚠️ **Para enviar emails reais aos utilizadores, deves usar um destes serviços:**

**SendGrid (Recomendado - Gratuito até 100 emails/dia):**

1. Regista-te em https://sendgrid.com
2. Cria uma API Key em Settings > API Keys
3. Configura no `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@gearlog.local
MAIL_FROM_NAME="GearLog"
```

**Mailgun (Gratuito até 5.000 emails/mês):**

1. Regista-te em https://mailgun.com
2. Verifica o teu domínio
3. Copia as credenciais SMTP
4. Configura no `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="GearLog"
```

**Amazon SES:**
```env
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
```

**Postmark:**
```env
MAIL_MAILER=postmark
POSTMARK_TOKEN=your-postmark-token
```

### 3. Testar o Envio

Para testar se o email está a funcionar:

```bash
php artisan tinker
```

Depois no tinker:
```php
use App\Models\User;
use Illuminate\Support\Facades\Password;

$user = User::where('email', 'test@example.com')->first();
Password::sendResetLink(['email' => $user->email]);
```

Ou testa diretamente através da API:
```bash
curl -X POST http://localhost:8000/api/v1/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 4. Verificar Logs

Se estiveres a usar `MAIL_MAILER=log`, podes ver os emails em:
```
backend/storage/logs/laravel.log
```

### 5. Template do Email

O template do email está em:
- `backend/app/Notifications/ResetPasswordNotification.php`

Podes personalizar:
- Assunto do email
- Conteúdo da mensagem
- Link de reset (usa `FRONTEND_URL` do `.env`)

## Troubleshooting

### Email não é enviado

1. Verifica as credenciais no `.env`
2. Verifica os logs: `storage/logs/laravel.log`
3. Testa a conexão SMTP:
   ```bash
   php artisan tinker
   Mail::raw('Test email', function($message) {
       $message->to('test@example.com')->subject('Test');
   });
   ```

### Link no email não funciona

1. Verifica `FRONTEND_URL` no `.env`
2. Verifica se a rota `/reset-password` existe no frontend
3. Verifica se o token não expirou (60 minutos)

### Email vai para spam

1. Configura SPF/DKIM no teu domínio
2. Usa um endereço de email válido em `MAIL_FROM_ADDRESS`
3. Considera usar um serviço profissional (Mailgun, SendGrid, etc.)

