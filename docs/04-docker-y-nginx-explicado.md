# Docker y Nginx explicados (incluyendo nuevo gateway)

Este documento explica la infraestructura Docker del proyecto y el Nginx añadido como reverse proxy central.

## 1. Estado actual de infraestructura

Archivo principal: `docker-compose.yml`

Servicios activos:

1. `mysql` (MySQL 8)
2. `backend` (Laravel en PHP 8.2)
3. `frontend` (React compilado servido por Nginx interno)
4. `nginx` (**nuevo gateway**) como punto de entrada único

Puertos:

- MySQL: `3308`
- Backend: `5000`
- Frontend directo: `6080`
- Gateway Nginx: `8080`

---

## 2. Nginx añadido al proyecto

Se añadió:

- Carpeta: `nginx/`
- Archivo: `nginx/nginx.conf`
- Servicio compose: `nginx` con imagen `nginx:alpine`

Configuración de routing del gateway:

- `/api/*` -> `backend:5000/api/*`
- `/audios/*` -> `backend:5000/audios/*`
- `/` -> `frontend:80`

Ventaja:

- Un único host/puerto (`http://localhost:8080`) para frontend + API.
- Evita problemas de CORS al compartir origen.

---

## 3. `docker-compose.yml` explicado

## `mysql`

- Imagen oficial MySQL 8.
- Puerto interno/externo 3308.
- Variables:
  - `MYSQL_DATABASE=cardiobeat_db`
  - usuario/password de app.
- Volúmenes:
  - persistencia de datos (`mysql_data`),
  - carga inicial SQL (`backend-laravel/database/init.sql`).
- `healthcheck` para esperar DB lista.

## `backend`

- Build desde `backend-laravel/Dockerfile`.
- Expone `5000`.
- Variables DB + JWT.
- Monta audios y uploads para persistencia de archivos.
- Depende de MySQL healthy.

## `frontend`

- Build multi-stage desde `frontend/Dockerfile`.
- Expone `6080` (host) -> `80` (container).
- Sirve app compilada con Nginx interno.

## `nginx` (nuevo)

- Imagen `nginx:alpine`.
- Expone `8080:80`.
- Monta `./nginx/nginx.conf`.
- Depende de `frontend` y `backend`.

---

## 4. Dockerfiles explicados

## Backend Dockerfile (`backend-laravel/Dockerfile`)

- Base `php:8.2-cli`.
- Instala `git`, `unzip`, `libzip-dev`, y extensiones `pdo`, `pdo_mysql`.
- Copia Composer desde imagen `composer:2`.
- Copia código.
- Crea path de uploads.
- Ejecuta `php artisan storage:link`.
- Al arrancar limpia cachés Laravel y levanta `artisan serve` en `0.0.0.0:5000`.

## Frontend Dockerfile (`frontend/Dockerfile`)

- Etapa `build` con `node:18-alpine`:
  - instala deps,
  - build de Vite.
- Etapa runtime con `nginx:alpine`:
  - copia `dist/` a `/usr/share/nginx/html`,
  - usa `frontend/nginx.conf`.

---

## 5. Diferencia entre los dos Nginx

1. **Nginx del frontend**
   - vive dentro del contenedor `frontend`.
   - sirve archivos estáticos React.

2. **Nginx gateway (nuevo)**
   - vive en contenedor `nginx`.
   - enruta tráfico entre frontend y backend.

No se pisan: cumplen roles distintos.

---

## 6. Comandos recomendados

Levantar stack:

```bash
docker compose up -d --build
```

Ver estado:

```bash
docker compose ps
```

Ver logs gateway:

```bash
docker compose logs -f nginx
```

Accesos:

- App vía gateway: `http://localhost:8080`
- App directa frontend: `http://localhost:6080`
- API directa backend: `http://localhost:5000/api/health`

---

## 7. Cuándo usar cada URL

- Desarrollo normal recomendado: `http://localhost:8080` (gateway).
- Debug de frontend aislado: `http://localhost:6080`.
- Pruebas API aisladas: `http://localhost:5000`.

---

## 8. Siguientes mejoras opcionales

- Añadir TLS local (mkcert) al gateway.
- Añadir compresión/cache headers en gateway.
- Quitar `version:` de compose (warning actual de Docker).
