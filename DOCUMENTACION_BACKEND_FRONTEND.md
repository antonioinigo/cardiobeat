# Documentación técnica completa: Backend + Frontend + relación entre ambos

## 1) Visión general de la arquitectura

CardioBeat está construido como una arquitectura **cliente-servidor**:

- **Frontend**: aplicación SPA en React (Vite) que renderiza la interfaz, maneja navegación y hace llamadas HTTP.
- **Backend**: API REST en Laravel 12 que valida, aplica reglas de negocio y consulta MySQL.
- **Base de datos**: MySQL con tablas para usuarios, sonidos, casos, progreso, red social, mensajería y casos inteligentes.

Flujo general:

1. El usuario interactúa en React.
2. React hace una petición HTTP a `/api/...` (Axios).
3. Laravel recibe la petición, valida token/JWT si aplica, ejecuta SQL y responde JSON.
4. React recibe JSON y actualiza estado/UI.

---

## 2) Backend: cómo está construido y cómo funciona

### 2.1 Punto de entrada y configuración

Archivos clave:

- `backend-laravel/bootstrap/app.php`
- `backend-laravel/routes/api.php`
- `backend-laravel/config/cardiobeat.php`
- `backend-laravel/config/cors.php`

En `bootstrap/app.php` se registra:

- el enrutado API (`routes/api.php`),
- middleware alias `jwt.auth`,
- middleware global de grupo API para cabeceras de seguridad (`SecurityHeaders`).

Esto significa que **toda ruta API** pasa por cabeceras de seguridad, y las rutas protegidas además por JWT.

---

### 2.2 Autenticación JWT

Archivos clave:

- `backend-laravel/routes/api.php` (rutas `/api/auth/*`)
- `backend-laravel/app/Http/Middleware/JwtAuth.php`
- `backend-laravel/config/cardiobeat.php`

#### ¿Qué ocurre en login?

1. Frontend envía email/password a `POST /api/auth/login`.
2. Backend busca usuario en DB (`users`) y valida hash de contraseña.
3. Si es válido, genera token JWT con:
   - `userId`
   - `email`
   - `role`
   - `iat` (emitido)
   - `exp` (caducidad)
4. Devuelve JSON con `token` y objeto `user`.

Ejemplo de respuesta de login:

```json
{
  "message": "Login exitoso",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 3,
    "email": "demo@cardiobeat.com",
    "name": "Demo",
    "role": "student"
  }
}
```

#### ¿Qué hace `JwtAuth`?

En cada ruta protegida:

- Lee `Authorization: Bearer <token>`.
- Decodifica JWT con `JWT_SECRET`.
- Si es válido, inyecta en request:
  - `auth_user_id`
  - `auth_email`
  - `auth_role`
- Si falla: 401 (sin token) o 403 (token inválido).

---

### 2.3 Estilo de implementación del backend

En este proyecto, la mayoría de endpoints están implementados como **closures dentro de `routes/api.php`**, en lugar de controladores clásicos por recurso.

Patrón típico:

1. Leer params (`$request->query`, `$request->input`).
2. Validar campos mínimos.
3. Ejecutar SQL con `DB::select / insert / update / delete`.
4. Devolver `response()->json(...)`.

Esto hace el código muy directo y rápido de seguir para MVP/prototipo.

---

### 2.4 Módulos principales de API

#### A) Contenido clínico base

- `/api/sounds` (biblioteca de sonidos)
- `/api/focus` (focos de auscultación)
- `/api/cases` (casos clínicos tradicionales)

Ejemplo: `GET /api/sounds` devuelve lista de sonidos con metadatos de foco.

#### B) Progreso académico

- `/api/progress`
- `/api/progress/stats`

Guarda actividades por usuario y calcula estadísticas de completado/tiempo/score.

#### C) Red social profesional

- `/api/posts`
- `/api/connections`
- `/api/messages`
- `/api/notifications`
- `/api/profile`

Ejemplo de lógica real:

- en `posts`, el feed se filtra por visibilidad (`public`, `connections`, propio).
- en `messages`, si no existe conversación entre dos usuarios, se crea automáticamente.

#### D) Casos inteligentes + entrenamiento con APIs médicas

- `/api/medical/conditions`
- `/api/medical/icd10`
- `/api/medical/training-case`
- `/api/smart-cases/*`

`/api/medical/training-case` agrega datos de:

- ClinicalTables
- HAPI FHIR
- PubMed
- ClinicalTrials
- openFDA

Y devuelve:

- sugerencias de condición
- ICD-10
- recursos científicos
- borrador preconstruido (`draft_case`) para crear entrenamiento.

---

### 2.5 Moderación por roles

Roles en JWT/user:

- `student`
- `professional`
- `admin`

En `smart-cases`:

- `student`: solo borradores.
- `professional`: puede enviar a revisión (`pending_review`).
- `admin`: puede publicar directo (`published`) o moderar (`approve/reject`).

Esto está implementado en backend, no solo en UI, por lo que la seguridad de permisos no depende únicamente del frontend.

---

### 2.6 Seguridad aplicada en backend

- JWT obligatorio en rutas privadas.
- Rate limit en auth (`throttle:auth`, `throttle:auth-register`).
- Cabeceras seguras (`X-Frame-Options`, `X-Content-Type-Options`, etc.) vía `SecurityHeaders`.
- CORS configurable por entorno (`CORS_ALLOWED_ORIGINS`).

---

## 3) Frontend: cómo está construido y cómo funciona

### 3.1 Entrada y arranque

Archivos clave:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/lib/http.js`

`main.jsx` importa `./lib/http` antes de renderizar App, para inicializar Axios globalmente.

---

### 3.2 Cliente HTTP global (Axios)

`frontend/src/lib/http.js` configura:

- `baseURL` desde `VITE_API_BASE_URL` (o vacío si usa proxy de Vite)
- `timeout = 15000`
- Header `Accept: application/json`

Interceptores:

- **request**: añade token `Authorization` desde `localStorage` si existe.
- **response**: ante 401/403 limpia sesión y redirige a `/login`.

Resultado: todas las páginas usan `axios` sin repetir lógica de token/errores.

---

### 3.3 Enrutado y protección de rutas

En `App.jsx`:

- Se carga usuario desde `localStorage` al iniciar.
- `requireAuth(...)` protege rutas privadas.
- Si no hay sesión, redirige a `/login`.

Rutas privadas importantes:

- `/dashboard`
- `/feed`
- `/network`
- `/messages`
- `/sounds`
- `/cases`
- `/simulador`

---

### 3.4 Estructura de páginas y responsabilidades

- `Login.jsx`: autenticación y persistencia de sesión.
- `Dashboard.jsx`: KPIs y accesos rápidos.
- `Sounds.jsx`: catálogo de sonidos desde `/api/sounds`.
- `Focus.jsx`: focos de auscultación desde `/api/focus`.
- `Cases.jsx`: casos tradicionales + constructor inteligente + entrenamiento con evidencia.
- `Feed.jsx`: publicaciones, likes, comentarios.
- `Network.jsx`: conexiones y solicitudes.
- `Messages.jsx`: conversaciones y chat.
- `Profile.jsx`: perfil profesional y secciones curriculares.
- `Simulator.jsx`: integra el módulo ECG (`ecgGame/App`).

---

### 3.5 Ejemplo real de ciclo en frontend (Login)

1. Usuario envía formulario en `Login.jsx`.
2. `axios.post('/api/auth/login', { email, password })`.
3. Si OK:
   - guarda `user` y `token` (vía `onLogin`),
   - navega a `/dashboard`.
4. Si error: muestra mensaje del backend (`error.response.data.error`).

---

### 3.6 Simulador ECG (subaplicación interna)

`pages/Simulator.jsx` solo monta `ecgGame/App`.

Dentro de `ecgGame` hay una app específica con:

- modo simulador en tiempo real,
- modo práctica con preguntas y puntuación,
- generación de ritmo ECG,
- sonido cardíaco sincronizado,
- UI educativa multilenguaje.

Es un buen ejemplo de componente complejo encapsulado dentro de la SPA principal.

---

## 4) Relación Backend ↔ Frontend (cómo se conectan)

## 4.1 Contrato API

El contrato entre capas es JSON sobre REST:

- Frontend **nunca** consulta MySQL directamente.
- Backend **nunca** renderiza vistas de negocio de la SPA.

La integración se basa en endpoints `/api/*` y payloads JSON.

---

### 4.2 Ejemplo completo: “Generar entrenamiento clínico”

Flujo:

1. En `Cases.jsx`, el usuario escribe una patología (`query`).
2. Frontend llama `GET /api/medical/training-case?terms=...`.
3. Backend consulta múltiples APIs médicas externas.
4. Backend compone una respuesta única con:
   - recursos científicos,
   - sugerencias ICD,
   - borrador clínico.
5. Frontend muestra evidencia y, si hay sesión, guarda borrador/publica según rol con `POST /api/smart-cases`.

Esto demuestra claramente la relación:

- **Frontend** orquesta UX y estado.
- **Backend** orquesta datos, reglas y seguridad.

---

### 4.3 Ejemplo completo: mensajería

1. `Messages.jsx` pide `GET /api/messages` para listado de conversaciones.
2. Al abrir chat: `GET /api/messages/{conversationId}/messages`.
3. Al enviar texto: `POST /api/messages/{otherUserId}`.
4. Backend:
   - crea conversación si no existe,
   - inserta mensaje,
   - marca timestamps,
   - genera notificación.

Resultado: el frontend recibe estructura lista para pintar UI sin lógica SQL.

---

## 5) Capa de datos (MySQL) y migraciones

El proyecto usa una migración especial que importa SQL inicial:

- `database/migrations/2026_02_17_000000_import_cardiobeat_init_sql.php`

Esa migración:

- carga `database/init.sql`,
- elimina sentencias `CREATE DATABASE`/`USE` para compatibilidad,
- ejecuta SQL bruto con `DB::unprepared(...)`.

Además hay migraciones incrementales para `smart_cases` (moderación/campos builder).

---

## 6) Entornos de ejecución

### 6.1 Desarrollo local

- Frontend en Vite (`localhost:3000`).
- Backend en Laravel (`localhost:5000`).
- Vite proxy reenvía `/api` al backend (`frontend/vite.config.js`).

Ventaja: en frontend puedes llamar a `/api/...` sin hardcodear host.

### 6.2 Docker Compose

`docker-compose.yml` levanta:

- `mysql` (puerto 3308)
- `backend` (puerto 5000)
- `frontend` (puerto 6080)

Relación de red: frontend consume backend por endpoint HTTP expuesto y ambos están en la misma red Docker.

---

## 7) Patrón mental para entender el código rápidamente

Si quieres seguir cualquier funcionalidad, usa este orden:

1. **UI**: localizar botón/form en página React.
2. **HTTP**: ver qué endpoint llama (`axios.get/post/...`).
3. **API**: buscar esa ruta en `routes/api.php`.
4. **Reglas**: revisar validaciones, role checks, JWT.
5. **SQL**: identificar tablas tocadas.
6. **Respuesta**: volver al frontend y ver cómo pinta el JSON.

Con ese patrón puedes depurar casi todo el proyecto de forma sistemática.

---

## 8) Resumen ejecutivo

- Frontend React gestiona experiencia de usuario, estado y navegación.
- Backend Laravel centraliza seguridad, permisos, lógica de negocio y acceso a datos.
- JWT conecta identidad y permisos entre ambas capas.
- El contrato JSON en `/api/*` desacopla UI de base de datos.
- El módulo de casos inteligentes es el ejemplo más completo de integración multicapa (UI + backend + APIs externas + moderación por rol).

---

## 9) Siguientes mejoras recomendadas (opcionales)

1. Migrar `routes/api.php` a controladores por dominio para mantener escalabilidad.
2. Añadir capa de servicios (por ejemplo, `MedicalTrainingService`) para extraer lógica de agregación externa.
3. Definir DTOs/Resources de respuesta para contratos más estrictos.
4. Añadir tests de integración para flujos críticos (auth, smart-cases, messages).
5. Documentar API en OpenAPI/Swagger para facilitar onboarding.
