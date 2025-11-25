FROM php:8.3-fpm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Definir diretório de trabalho
WORKDIR /var/www

# Copiar ficheiros de configuração primeiro (para cache do Docker)
# Como o contexto de build é a raiz do projeto, precisamos especificar backend/
COPY backend/composer.json backend/composer.lock ./

# Instalar dependências do PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copiar resto dos ficheiros do backend
COPY backend/ .

# Criar diretórios necessários ANTES de executar scripts do Composer
RUN mkdir -p bootstrap/cache storage/framework/cache storage/framework/sessions storage/framework/views \
    && chmod -R 775 bootstrap/cache storage

# Executar scripts do Composer (agora com diretórios criados)
RUN composer dump-autoload --optimize

# Configurar permissões finais
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Expor porta (Railway usa variável $PORT)
EXPOSE 8000

# Criar script de start robusto
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "=== GearLog Backend Starting ==="\n\
echo "Environment: ${APP_ENV:-unknown}"\n\
echo "Port: ${PORT:-8000}"\n\
\n\
# Limpar cache (importante para Railway, onde env vars podem mudar)\n\
echo "Clearing caches..."\n\
php artisan config:clear || echo "Config clear failed"\n\
php artisan cache:clear || echo "Cache clear failed"\n\
php artisan route:clear || echo "Route clear failed"\n\
php artisan view:clear || echo "View clear failed"\n\
\n\
# Tentar executar migrações (não falhar se BD não estiver pronta)\n\
echo "Running migrations..."\n\
php artisan migrate --force || echo "Migration failed, continuing..."\n\
\n\
# Criar storage link (ignorar se já existir)\n\
echo "Creating storage link..."\n\
php artisan storage:link || true\n\
\n\
# Verificar configuração crítica\n\
echo "Checking configuration..."\n\
php artisan config:show app.url || echo "Config check failed"\n\
\n\
# Iniciar servidor PHP\n\
echo "Starting PHP server on port ${PORT:-8000}"\n\
exec php -S 0.0.0.0:${PORT:-8000} -t public\n\
' > /start.sh && chmod +x /start.sh

# Comando de start
CMD ["/start.sh"]
