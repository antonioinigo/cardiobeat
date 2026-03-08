# 🫀 CardioBeat React - Guía de Instalación Completa

## 📋 Requisitos Previos

1. **Node.js** (versión 18 o superior)
   - Descargar: https://nodejs.org/
2. **MySQL** (versión 8 o superior)
   - Windows: https://dev.mysql.com/downloads/installer/
   - Durante la instalación, anota tu contraseña de root

3. **Git** (opcional pero recomendado)
   - Descargar: https://git-scm.com/

## 🗄️ Paso 1: Configurar MySQL

### 1.1 Crear la Base de Datos

Abre MySQL Workbench o tu terminal/PowerShell:

```sql
mysql -u root -p
```

Luego ejecuta:

```sql
CREATE DATABASE cardiobeat_db;
USE cardiobeat_db;
```

### 1.2 Ejecutar el Script de Creación

En Laravel ya tienes migración + script SQL integrados. Ejecuta:

```bash
cd backend-laravel
php artisan cardiobeat:setup-db
```

Si prefieres carga manual, en la carpeta `backend-laravel` está `database/init.sql`.

**Opción A - Desde MySQL Workbench:**

1. Abre MySQL Workbench
2. Conecta a tu servidor
3. File → Open SQL Script
4. Selecciona `backend-laravel/database/init.sql`
5. Ejecuta el script (rayo ⚡)

**Opción B - Desde terminal:**

```bash
cd backend-laravel
php artisan cardiobeat:setup-db
```

## 🎵 Paso 2: Descargar Audios Cardíacos

Los audios no se incluyeron por derechos de autor. Descárgalos de estas fuentes:

### Fuentes Recomendadas:

1. **ThinkLabs** - https://www.thinklabs.com/heart-sounds/
2. **EasyAuscultation** - https://www.easyauscultation.com/
3. **University of Michigan** - https://open.umich.edu/

### Audios Necesarios:

Guarda estos archivos MP3 en `backend-laravel/audios/`:

- `normal_heart.mp3` - Ruidos normales
- `soplo_estenosis_aortica.mp3` - Soplo sistólico
- `soplo_insuficiencia_mitral.mp3` - Soplo diastólico
- `clic_estenosis_mitral.mp3` - Clic de apertura
- `galope_s3.mp3` - Tercer ruido
- `roce_pericardico.mp3` - Roce pericárdico

## 🔧 Paso 3: Configurar el Backend

### 3.1 Navegar e Instalar Dependencias

```powershell
cd backend-laravel
composer install
```

### 3.2 Configurar Variables de Entorno

Edita el archivo `.env` y actualiza con tus datos:

```env
APP_URL=http://localhost:5000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3308
DB_DATABASE=cardiobeat_db
DB_USERNAME=root
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
JWT_SECRET=cambia-esto-por-algo-seguro-y-aleatorio
APP_ENV=local
```

### 3.3 Iniciar el Backend

```powershell
php artisan serve --host=127.0.0.1 --port=5000
```

O para desarrollo con auto-reload:

```powershell
php artisan serve --host=127.0.0.1 --port=5000
```

Deberías ver:

```
INFO  Server running on [http://127.0.0.1:5000].
```

## ⚛️ Paso 4: Configurar el Frontend

### 4.1 Abrir Nueva Terminal

Mantén la terminal del backend abierta y abre una nueva.

### 4.2 Navegar e Instalar

```powershell
cd frontend
npm install
```

### 4.3 Iniciar el Frontend

```powershell
npm run dev
```

Deberías ver:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## 🚀 Paso 5: ¡Usar la Aplicación!

1. Abre tu navegador en **http://localhost:3000**

2. **Credenciales de prueba:**
   - Email: `demo@cardiobeat.com`
   - Contraseña: `cardio123`

3. O crea una cuenta nueva desde la página de login

## 📱 Funcionalidades Disponibles

### ✅ Implementadas:

- ✓ Sistema de autenticación (login/registro)
- ✓ Dashboard personalizado con estadísticas
- ✓ Biblioteca de sonidos cardíacos con reproductor
- ✓ Focos de auscultación con descripción detallada
- ✓ Casos clínicos interactivos
- ✓ Seguimiento de progreso del usuario
- ✓ API RESTful completa
- ✓ Base de datos MySQL

### 🎨 Diseño:

- Inspirado en cardiobeat.es
- Colores corporativos (rojo #e63946)
- Responsive para móvil y desktop
- Animaciones y transiciones suaves

## 🛠️ Comandos Útiles

### Backend:

```powershell
cd backend-laravel
php artisan serve --host=127.0.0.1 --port=5000
```

### Frontend:

```powershell
cd frontend
npm run dev        # Servidor desarrollo
npm run build      # Compilar para producción
npm run preview    # Vista previa producción
```

## 📊 Estructura del Proyecto

```
cardiobeat-react/
├── backend-laravel/
│   ├── app/
│   ├── routes/
│   │   ├── api.php           # API principal
│   │   └── web.php           # Archivos estáticos (audios/uploads)
│   ├── audios/               # Archivos MP3
│   ├── database/
│   │   └── init.sql          # Script BD
│   ├── .env                  # Variables entorno
│   └── artisan
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx    # Navegación
│   │   │   └── Footer.jsx    # Pie de página
│   │   ├── pages/
│   │   │   ├── Home.jsx      # Página inicio
│   │   │   ├── Login.jsx     # Login/Registro
│   │   │   ├── Dashboard.jsx # Panel usuario
│   │   │   ├── Sounds.jsx    # Biblioteca sonidos
│   │   │   ├── Cases.jsx     # Casos clínicos
│   │   │   └── Focus.jsx     # Focos cardíacos
│   │   ├── App.jsx           # Componente principal
│   │   ├── main.jsx          # Punto entrada
│   │   └── index.css         # Estilos globales
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md

## 🐛 Solución de Problemas

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Comprueba usuario y contraseña en `.env`
- Asegúrate de que la base de datos existe

### Error: "Port 5000 is already in use"
- Cambia el puerto en `.env` (ej: PORT=5001)
- Actualiza la URL en `frontend/vite.config.js`

### No se reproducen los audios
- Verifica que los archivos MP3 estén en `backend-laravel/audios/`
- Comprueba que los nombres coincidan con la base de datos
- Abre las DevTools del navegador para ver errores

### Error: "Module not found"
- Borra `node_modules` y `package-lock.json`
- Ejecuta `npm install` nuevamente

## 📝 Notas Adicionales

- Los passwords se hashean con bcrypt (seguro)
- Los tokens JWT expiran en 24 horas
- La aplicación usa CORS para desarrollo
- Los audios se sirven como archivos estáticos

## 🎯 Próximos Pasos

1. Añadir más sonidos cardíacos
2. Implementar modo examen
3. Agregar visualización de fonocardiograma
4. Sistema de calificaciones
5. Modo offline
6. App móvil nativa

## 📞 Soporte

Si tienes problemas:
1. Revisa esta guía paso a paso
2. Verifica los logs de la terminal
3. Comprueba la consola del navegador (F12)

---

¡Disfruta aprendiendo auscultación cardíaca con CardioBeat! 🫀
```
