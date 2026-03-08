# Frontend CardioBeat explicado (React + Vite)

Este documento explica el frontend de forma didáctica, con detalle sobre arranque, routing, estado de sesión y flujo de autenticación.

## 1. Arquitectura frontend

Ubicación: `frontend/`

Piezas clave:

- `src/main.jsx`: punto de entrada.
- `src/lib/http.js`: configuración global de Axios.
- `src/App.jsx`: routing principal.
- `src/pages/*`: pantallas.
- `src/components/*`: elementos reutilizables (header/footer).
- `src/styles/unified.css`: estilos comunes.

---

## 2. `main.jsx` (arranque)

Archivo: `frontend/src/main.jsx`

Línea a línea:

- `import React` y `ReactDOM`.
- `import './lib/http'`: carga la configuración de Axios **antes** de renderizar.
- `import App`.
- `import './styles/unified.css'`: estilos globales.
- `ReactDOM.createRoot(...).render(...)`: monta la app en `#root`.
- `React.StrictMode`: activa chequeos extra de desarrollo.

---

## 3. Cliente HTTP unificado (`lib/http.js`)

Archivo: `frontend/src/lib/http.js`

Qué hace:

- `axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''`
  - Si está vacío, usa mismo host/origen (útil con proxy Nginx).
- Timeout global: 15s.
- Header global `Accept: application/json`.

Interceptors:

1. Request interceptor
   - Si hay token en `localStorage` y no existe `Authorization`, añade `Bearer <token>`.
2. Response interceptor
   - Si llega `401` o `403`, limpia sesión local y redirige a `/login`.

Resultado: todas las páginas comparten comportamiento HTTP consistente.

---

## 4. Routing principal (`App.jsx`)

Archivo: `frontend/src/App.jsx`

Lógica central:

- Estado `user` y `loading`.
- En `useEffect` inicial:
  - lee `token` y `user` de `localStorage`.
  - si JSON inválido, limpia sesión.
- `handleLogin`: guarda `user` + `token`.
- `handleLogout`: borra sesión.
- `requireAuth(element)`: wrapper para rutas protegidas.

Rutas importantes:

- Públicas:
  - `/`
  - `/login`
  - `/register`
  - `/verify-email`
  - `/forgot-password`
  - `/reset-password`
  - varias vistas guest (`/sounds`, `/cases`, `/simulador` si no logado)
- Protegidas:
  - `/feed`, `/profile/:userId`, `/network`, `/messages`, `/cases/test`

---

## 5. Login (`pages/Login.jsx`)

Flujo:

1. Usuario introduce email/password.
2. Se normaliza email (`trim().toLowerCase()`).
3. POST `/api/auth/login`.
4. Si ok:
   - `onLogin(user, token)`
   - `navigate('/profile')`
5. Si error con `code=email_not_verified`:
   - muestra botón “Reenviar verificación”.

Reenvío:

- `POST /api/auth/verify-email/resend` con email.
- Muestra feedback visual (`alert-success` / `alert-error`).

---

## 6. Registro y verificación

### Registro (`Register.jsx`)

- Crea cuenta y espera verificación email.

### Verificación (`VerifyEmail.jsx`)

- Lee `token` de query string.
- Llama `GET /api/auth/verify-email?token=...`.
- Muestra estado:
  - loading
  - ok
  - error

---

## 7. Recuperación de contraseña (flujo nuevo en 2 pasos)

### Paso A: pedir token (`ForgotPassword.jsx`)

- Form simple con email.
- `POST /api/auth/password/forgot`.
- Mensaje: se envía token por email.
- Link “Ya tengo un token” a `/reset-password`.

### Paso B: validar token y cambiar password (`ResetPassword.jsx`)

Pantalla 2 fases:

1. **Validar token**
   - Campos: email + token.
   - `POST /api/auth/password/validate-token`.
   - Si válido -> habilita fase 2.
2. **Nueva contraseña**
   - Campos: password + password_confirmation.
   - valida coincidencia en frontend.
   - `POST /api/auth/password/reset`.
   - Si ok -> redirige a `/login`.

Esto cumple el requisito de token manual + doble contraseña.

---

## 8. Estado y persistencia de sesión

Se usa `localStorage`:

- `token`
- `user` (JSON)

Ventajas:

- Persistencia al refrescar.
- Integración directa con Axios interceptors.

Cuidado:

- Cualquier `401/403` limpia sesión por seguridad.

---

## 9. Diseño de UI

- Estilos centralizados en `styles/unified.css`.
- Iconografía con `lucide-react`.
- Componentes de feedback:
  - `alert`
  - `alert-error`
  - `alert-success`
- Estructura visual común en auth pages:
  - columna informativa + card de formulario.

---

## 10. Dependencias frontend

Archivo: `frontend/package.json`

- Runtime:
  - `react`, `react-dom`
  - `react-router-dom`
  - `axios`
  - `lucide-react`
- Build:
  - `vite`
  - `@vitejs/plugin-react`

Scripts:

- `npm run dev`
- `npm run build`
- `npm run preview`

---

## 11. Ejemplo de trazabilidad completa

Caso “olvidé contraseña”:

1. Usuario entra en `/forgot-password`.
2. Front llama `/api/auth/password/forgot`.
3. Usuario recibe email con token.
4. En `/reset-password`, valida token.
5. Si token válido, aparece formulario de nueva contraseña.
6. Envía password final.
7. Backend actualiza hash y marca token usado.
