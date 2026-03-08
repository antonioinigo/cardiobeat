# Guía simple del backend (CardioBeat)

## ¿Qué cambiamos?

Antes: casi todo estaba en un solo archivo de rutas (`routes/api.php`) con funciones largas.

Ahora: está separado en 3 partes fáciles:

1. **Rutas**: dicen "qué URL llama a qué método".
2. **Controladores**: contienen la lógica de cada endpoint.
3. **Modelos**: representan las tablas (aunque seguimos usando SQL directo).

---

## Estructura básica

- `routes/api.php` → mapa de endpoints
- `app/Http/Controllers/Api/` → lógica por módulo
- `app/Models/` → modelos de tablas

Ejemplo:

- Ruta: `GET /api/sounds`
- Controlador: `SoundController@index`
- SQL real: está dentro de `SoundController`

---

## Controladores creados

- `AuthController`
- `SoundController`
- `FocusController`
- `CaseController`
- `ProgressController`
- `PostController`
- `ConnectionController`
- `MessageController`
- `NotificationController`
- `ProfileController`
- `EcgController`
- `FollowController`
- `UploadController`
- `MedicalController`
- `SmartCaseController`
- `HealthController`

---

## Modelos creados

Se crearon modelos para las tablas principales, por ejemplo:

- `HeartSound`, `CardiacFocus`, `ClinicalCase`, `CaseAttempt`
- `UserProgress`, `SmartCase`
- `Post`, `PostComment`, `Connection`
- `Conversation`, `Message`, `Notification`

> Importante: por ahora **seguimos usando SQL directo** (`DB::select`, `DB::insert`, etc.), que era tu requisito.

---

## Cómo leer un endpoint (muy fácil)

1. Busca la ruta en `routes/api.php`.
2. Mira qué controlador y método usa.
3. Abre ese método en `app/Http/Controllers/Api/`.
4. Ahí verás validación, SQL y respuesta JSON.

---

## Ejemplo corto real

Ruta en `api.php`:

```php
Route::get('/sounds', [SoundController::class, 'index']);
```

Método en `SoundController`:

- lee filtros (`type`, `focus_id`)
- ejecuta SQL en `heart_sounds`
- devuelve JSON

---

## Ventajas de esta versión

- Más ordenado.
- Más fácil de encontrar errores.
- Más fácil de enseñar y mantener.
- Misma funcionalidad que antes.

---

## Cómo crear un endpoint nuevo

1. Añade método en un controlador de `app/Http/Controllers/Api/`.
2. Añade ruta en `routes/api.php`.
3. Si hace falta, crea modelo en `app/Models/`.
4. Prueba con:

```bash
php artisan route:list --path=api
```

---

## Estado actual

- Backend simplificado a estructura clásica Laravel.
- Rutas activas y válidas.
- Lógica SQL mantenida sin romper comportamiento.
