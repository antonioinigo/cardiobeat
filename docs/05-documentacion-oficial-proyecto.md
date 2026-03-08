# Documentación oficial del proyecto CardioBeat

> Documento oficial consolidado para instalación, ejecución, arquitectura y operación.

## 1. Descripción

CardioBeat es una plataforma educativa para entrenamiento en auscultación cardíaca y práctica clínica.

Incluye:

- Biblioteca de sonidos cardíacos.
- Focos de auscultación.
- Casos clínicos y smart-cases.
- Simulador y seguimiento de progreso.
- Módulo social (perfil, publicaciones, mensajes).
- Autenticación con verificación email y recuperación por token.

---

## 2. Stack tecnológico

## Frontend

- React 18
- React Router 6
- Axios
- Vite 5
- Lucide React

## Backend

- Laravel 12
- PHP 8.2
- Firebase JWT
- SQL directo con `DB::*`

## Base de datos

- MySQL 8

## Infraestructura

- Docker Compose
- Nginx (frontend interno + gateway externo)

---

## 3. Estructura de repositorio

```text
cardiobeat-react/
├── backend-laravel/
├── frontend/
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── README.md
├── INSTALLATION.md
├── README-DOCKER.md
└── docs/
```

---

## 4. Ejecución oficial (Docker)

```bash
docker compose up -d --build
```

Endpoints:

- Gateway recomendado: `http://localhost:8080`
- Frontend directo: `http://localhost:6080`
- Backend API: `http://localhost:5000`
- Salud API: `http://localhost:5000/api/health`

---

## 5. Configuración de correo (Mailtrap Sandbox)

En `backend-laravel/.env`:

- `MAIL_MAILER=smtp`
- `MAIL_HOST=sandbox.smtp.mailtrap.io`
- `MAIL_PORT=2525`
- `MAIL_USERNAME=<sandbox_username>`
- `MAIL_PASSWORD=<sandbox_password>`

`FRONTEND_URL` debe apuntar a la URL real del frontend (ej. `http://localhost:8080` si usas gateway).

---

## 6. Autenticación oficial

Flujos implementados:

1. Registro con email de verificación (botón HTML).
2. Login bloqueado hasta verificar email.
3. Reenvío de verificación.
4. Recuperación de contraseña con token:
   - solicitud token,
   - validación token,
   - nueva contraseña con confirmación doble.

Endpoints auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email`
- `POST /api/auth/verify-email/resend`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/validate-token`
- `POST /api/auth/password/reset`

---

## 7. Base de datos oficial

Fuente principal de esquema:

- `backend-laravel/database/init.sql`

Evolución:

- `backend-laravel/database/migrations/*.php`

Tablas destacadas:

- `users`
- `heart_sounds`, `cardiac_focus`, `clinical_cases`, `smart_cases`
- `email_verification_tokens`, `password_reset_tokens`
- `saved_smart_cases`, `smart_case_attempts`

---

## 8. Seguridad oficial

- Middleware JWT en rutas privadas.
- Cabeceras de seguridad HTTP para API.
- Rate limiting en auth.
- Password hashing con bcrypt (`Hash::make`).
- Tokens sensibles guardados como hash SHA-256.
- Tokens con expiración y single-use (`used_at`).

---

## 9. Guía de desarrollo

## Backend

```bash
cd backend-laravel
composer install
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=5000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 10. Documentación técnica complementaria

- Backend detallado: `docs/01-backend-explicado.md`
- Frontend detallado: `docs/02-frontend-explicado.md`
- BBDD y migraciones: `docs/03-bbdd-y-migraciones-explicadas.md`
- Docker y Nginx: `docs/04-docker-y-nginx-explicado.md`

---

## 11. Criterios de operación

- Entorno de acceso recomendado: gateway Nginx (`8080`).
- Mantener secretos en `.env` y fuera de commits.
- Ejecutar migraciones controladas antes de despliegue.
- Validar flujos auth/mail tras cambios de configuración SMTP.

---

## 12. Roadmap sugerido

- Añadir OpenAPI/Swagger de endpoints.
- Añadir tests automáticos end-to-end auth.
- Separar secretos por entorno (`.env.production`).
- Harden de Nginx gateway (TLS, CSP, rate-limit por IP).
