# Base de datos y migraciones explicadas

Este documento describe el esquema MySQL, la filosofía de datos del proyecto y cada migración relevante.

## 1. Enfoque de BBDD en este proyecto

El proyecto usa una base inicial grande (`database/init.sql`) más migraciones incrementales.

Patrón:

1. `init.sql` crea núcleo funcional (usuarios, red social, sonidos, casos, progreso).
2. Migraciones posteriores evolucionan tablas sin rehacer todo.

---

## 2. `init.sql` (esquema base)

Archivo: `backend-laravel/database/init.sql`

Bloques principales:

- **Usuarios y perfil**: `users`, `user_media`, `professional_experience`, `education`, `certifications`.
- **Social**: `connections`, `posts`, `post_media`, `post_likes`, `post_comments`, `follows`, `notifications`.
- **Mensajería**: `conversations`, `messages`.
- **Dominio cardiológico**:
  - `cardiac_focus`
  - `heart_sounds`
  - `clinical_cases`
  - `smart_cases`
- **Aprendizaje**:
  - `user_progress`
  - `case_attempts`
  - `ecg_sessions`

Incluye también seed inicial:

- focos cardíacos,
- sonidos ejemplo,
- casos clínicos,
- usuarios demo/admin.

---

## 3. Relaciones clave

- `users` relaciona con casi todo (`ON DELETE CASCADE` en muchos casos).
- `heart_sounds.focus_id -> cardiac_focus.id`.
- `clinical_cases.sound_id -> heart_sounds.id`.
- `smart_cases.created_by -> users.id`.
- Social:
  - `post_likes(post_id, user_id)` unique,
  - `connections(requester_id, receiver_id)` unique,
  - `follows(follower_id, following_id)` unique.

Objetivo: evitar duplicados de relación y conservar integridad referencial.

---

## 4. Migraciones (explicadas una a una)

## 4.1 `0001_01_01_000001_create_cache_table.php`

Crea tablas internas de Laravel:

- `cache`
- `cache_locks`

No son dominio de negocio, son infraestructura de framework.

## 4.2 `0001_01_01_000002_create_jobs_table.php`

Crea tablas de colas y batch jobs:

- `jobs`
- `job_batches`
- `failed_jobs`

Permite colas asíncronas y trazabilidad de fallos.

## 4.3 `2026_02_17_000000_import_cardiobeat_init_sql.php`

Función:

- Si no existe `users`, carga `database/init.sql` automáticamente.

Detalle importante:

- limpia líneas `CREATE DATABASE` y `USE` antes de ejecutar.
- `down()` elimina tablas del esquema base en orden seguro.

## 4.4 `2026_02_17_010000_add_moderation_columns_to_smart_cases.php`

Evoluciona `smart_cases` para moderación:

- amplía `status` a: `draft`, `pending_review`, `published`, `rejected`.
- añade:
  - `reviewed_by`
  - `reviewed_at`
  - `reviewer_notes`

Soporta flujo editorial/revisión.

## 4.5 `2026_02_17_020000_add_builder_fields_to_smart_cases.php`

Añade campos del constructor clínico:

- `patient_context`
- `diagnosis_questions`

Mejora calidad estructural del caso.

## 4.6 `2026_02_22_030000_create_saved_smart_cases_table.php`

Crea `saved_smart_cases` para favoritos:

- relación `user_id` + `smart_case_id`
- `UNIQUE` para evitar guardar dos veces el mismo caso.

## 4.7 `2026_02_22_040000_refresh_smart_cases_for_testing.php`

Migración de datos (data migration):

- limpia casos previos de test.
- inserta 5 casos tipo test publicados.
- usa admin como autor/revisor cuando existe.

## 4.8 `2026_02_22_050000_create_smart_case_attempts_table.php`

Crea `smart_case_attempts`:

- guarda intentos de usuarios sobre smart cases.
- campos de evaluación:
  - `submitted_answer`
  - `expected_answer`
  - `is_correct`
  - `feedback`

## 4.9 `2026_02_22_060000_create_auth_email_and_password_tokens_tables.php`

Crea tablas de seguridad para auth:

- `email_verification_tokens`
- `password_reset_tokens`

Patrón de seguridad:

- guarda `token_hash` (no token plano),
- usa `expires_at` y `used_at`,
- índices por usuario/email y expiración.

---

## 5. Flujo de datos de autenticación nuevo

### Verificación email

1. Registro crea token aleatorio.
2. Se guarda hash SHA-256 en `email_verification_tokens`.
3. Email lleva token raw.
4. Al confirmar, se hashea input y compara contra DB.
5. Se marca token `used_at` + usuario `is_verified=1`.

### Reset password

1. Forgot genera token.
2. Guarda hash en `password_reset_tokens`.
3. Usuario valida token manualmente.
4. Reset final cambia password hasheada en `users`.
5. Marca token usado.

---

## 6. Recomendaciones operativas

- Mantener backups antes de migraciones de datos (`refresh_*`).
- Evitar editar `init.sql` sin reflejar cambios en migraciones nuevas.
- Para cambios de esquema, preferir migraciones incrementales y reversibles.
