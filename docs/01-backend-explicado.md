# Backend CardioBeat explicado (Laravel)

Este documento explica el backend de forma práctica y detallada, con foco en los archivos más importantes y su lógica real.

## 1. Arquitectura backend

El backend está en `backend-laravel/` y sigue estructura Laravel 12:

- `routes/api.php`: define endpoints REST.
- `app/Http/Controllers/Api/*`: lógica de negocio por módulo.
- `app/Http/Middleware/*`: seguridad (JWT + headers).
- `config/cardiobeat.php`: parámetros JWT.
- `database/migrations/*`: evolución de esquema.

Flujo general:

1. Llega request a `/api/*`.
2. Pasa por middlewares (`SecurityHeaders`, y `JwtAuth` en rutas protegidas).
3. Entra al controlador.
4. El controlador valida, consulta DB (mucho SQL directo con `DB::select/insert/update`), y responde JSON.

---

## 2. `bootstrap/app.php` (arranque de la app)

Archivo: `backend-laravel/bootstrap/app.php`

Explicación casi línea por línea:

- `Application::configure(basePath: dirname(__DIR__))`: crea la app Laravel apuntando al directorio raíz.
- `withRouting(...)`: registra archivos de rutas:
  - `api.php` para API,
  - `web.php` para web clásica,
  - `console.php` para comandos Artisan,
  - `health: '/up'` para health check.
- `withMiddleware(...)`:
  - alias `jwt.auth` -> `App\Http\Middleware\JwtAuth`.
  - alias `security.headers` -> `App\Http\Middleware\SecurityHeaders`.
  - `appendToGroup('api', [SecurityHeaders::class])`: añade cabeceras de seguridad a **todo** `/api`.
- `withExceptions(...)`: hook para manejo global (actualmente vacío).

---

## 3. Middleware de autenticación JWT

Archivo: `backend-laravel/app/Http/Middleware/JwtAuth.php`

Lógica detallada:

1. Lee secreto con `config('cardiobeat.jwt.secret')`.
2. Si no existe, responde `500` (config incompleta).
3. Lee header `Authorization`.
4. Exige formato `Bearer <token>`.
5. Decodifica token con `JWT::decode(..., new Key(..., 'HS256'))`.
6. Si decode funciona, guarda en request:
   - `auth_user_id`
   - `auth_email`
   - `auth_role`
7. Si falla decode o no hay `userId`, responde `403 Token inválido`.
8. Si todo bien, `return $next($request)`.

Ejemplo:

- Request con token válido a `/api/auth/profile` -> pasa middleware.
- Request sin token -> `401`.

---

## 4. Middleware de seguridad HTTP

Archivo: `backend-laravel/app/Http/Middleware/SecurityHeaders.php`

Qué añade:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restringida
- `X-Permitted-Cross-Domain-Policies: none`
- Si HTTPS: `Strict-Transport-Security`
- En `/api/auth/*`: `Cache-Control no-store` y `Pragma no-cache`.

Objetivo: endurecer seguridad y evitar cache de respuestas sensibles de auth.

---

## 5. Config JWT

Archivo: `backend-laravel/config/cardiobeat.php`

- `jwt.secret`: viene de `JWT_SECRET` en `.env`.
- `jwt.ttl_minutes`: de `JWT_TTL_MINUTES` (default 1440 = 24h).

Por qué importa:

- El secreto firma y valida tokens.
- El TTL define expiración.

---

## 6. Rutas principales API

Archivo: `backend-laravel/routes/api.php`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email`
- `POST /api/auth/verify-email/resend`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/validate-token`
- `POST /api/auth/password/reset`
- `GET /api/auth/profile` (protegida con JWT)

### Otros módulos

- `/sounds`, `/focus`, `/cases`, `/smart-cases`, `/progress`, `/posts`, `/messages`, `/notifications`, etc.

Patrón aplicado:

- Público para lectura donde tiene sentido.
- Mutaciones y datos personales bajo `jwt.auth`.

---

## 7. AuthController (núcleo de autenticación)

Archivo: `backend-laravel/app/Http/Controllers/Api/AuthController.php`

### `register`

- Valida `email`, `password` + `password_confirmation`, `name`, `role`.
- Comprueba duplicados en `users`.
- Inserta usuario con hash (`Hash::make`).
- Crea token de verificación email.
- Devuelve `201`.

### `login`

- Valida credenciales.
- Busca usuario por email.
- Verifica password (`Hash::check` y fallback `password_verify`).
- Exige `is_verified = true`.
- Genera JWT con `userId`, `email`, `role`, `iat`, `exp`.

### `verifyEmail`

- Recibe token.
- Hashea token (`sha256`) y busca en `email_verification_tokens`.
- Si válido/no usado/no expirado:
  - marca `users.is_verified = 1`
  - marca `used_at` del token.

### `forgotPassword`

- Recibe email.
- Si usuario existe: crea token de reset.
- Respuesta neutra (no revela si email existe).

### `validateResetToken`

- Nuevo flujo 2 pasos.
- Valida email+token contra tabla `password_reset_tokens`.
- Devuelve éxito o `400 token inválido/expirado`.

### `resetPassword`

- Exige email + token + password + confirmation.
- Revalida token en DB.
- Actualiza password hasheada.
- Marca token usado.

### Emails (importante)

- Verificación: email HTML con botón `Confirmar registro`.
- Recuperación: email HTML con:
  - token visible para copiar/pegar,
  - botón para abrir vista de reset.

---

## 8. Estilo de acceso a datos

En este proyecto se usa bastante SQL directo:

- `DB::select`
- `DB::insert`
- `DB::update`
- `DB::transaction`

Ventajas:

- Control total SQL.
- Fácil ver qué consulta exacta se ejecuta.

Coste:

- Menos abstracción que Eloquent.
- Más responsabilidad manual en validaciones/consistencia.

---

## 9. Buenas prácticas ya aplicadas

- Passwords hasheadas (`Hash::make`).
- JWT con expiración.
- Verificación email obligatoria antes de login.
- Tokens de verificación/reset hashados en DB (no en plano).
- Tokens con expiración y `used_at`.
- Cabeceras de seguridad en API.
- Rate limit en endpoints sensibles.

---

## 10. Ejemplos de uso API

### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!"
}
```

### Validar token de reset

```http
POST /api/auth/password/validate-token
Content-Type: application/json

{
  "email": "ana@example.com",
  "token": "TOKEN_COPIADO_DEL_EMAIL"
}
```

### Reset final

```http
POST /api/auth/password/reset
Content-Type: application/json

{
  "email": "ana@example.com",
  "token": "TOKEN_COPIADO_DEL_EMAIL",
  "password": "NuevaPass123!",
  "password_confirmation": "NuevaPass123!"
}
```
