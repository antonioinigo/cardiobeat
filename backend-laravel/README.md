# Backend CardioBeat (Laravel)

Backend API REST para autenticación, sonidos cardíacos, casos clínicos, red social académica y mensajería.

## Requisitos

- PHP 8.2+
- Composer
- MySQL/MariaDB

## Instalación

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configura en `.env`:

- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` (obligatorio)
- `JWT_TTL_MINUTES` (default 1440)
- `CORS_ALLOWED_ORIGINS` (orígenes permitidos separados por coma)

Inicialización de datos:

```bash
php artisan cardiobeat:setup-db
```

Ejecución local:

```bash
php artisan serve --host=127.0.0.1 --port=5000
```

## Seguridad incluida

- Middleware JWT obligatorio para rutas protegidas
- Rate limit en login y registro
- Cabeceras de seguridad HTTP en grupo `api`
- CORS configurable por entorno
- Sin fallback de `JWT_SECRET` inseguro

## Comandos útiles

```bash
php artisan test
php artisan config:clear
php artisan route:list
```
