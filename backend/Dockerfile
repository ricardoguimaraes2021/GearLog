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
COPY backend/composer.json backend/composer.lock ./

# Instalar dependências do PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copiar resto dos ficheiros
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

# Comando de start
CMD php artisan migrate --force && \
    php artisan storage:link && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php -S 0.0.0.0:${PORT:-8000} -t public

