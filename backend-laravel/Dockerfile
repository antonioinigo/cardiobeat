FROM php:8.2-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN mkdir -p storage/app/public/uploads

RUN php artisan storage:link || true

EXPOSE 5000

CMD ["sh", "-c", "rm -f bootstrap/cache/*.php; php artisan config:clear; php artisan cache:clear; php artisan route:clear; php artisan view:clear; php artisan serve --host=0.0.0.0 --port=5000"]
