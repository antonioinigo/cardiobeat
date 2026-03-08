# 🐳 CardioBeat - Ejecución con Docker

## 🚀 Inicio Rápido (3 comandos)

### 1️⃣ Instalar Docker Desktop (si no lo tienes)

Descarga e instala Docker Desktop:

- **Windows/Mac**: https://www.docker.com/products/docker-desktop/

### 2️⃣ Construir y Ejecutar

Abre PowerShell o Terminal en la carpeta `cardiobeat-react` y ejecuta:

```powershell
docker-compose up --build
```

### 3️⃣ ¡Listo! Abre tu navegador

- **Frontend**: http://localhost:6080
- **Backend API**: http://localhost:5000/api/health
- **MySQL**: localhost:3308

**Credenciales de prueba:**

- Email: `demo@cardiobeat.com`
- Contraseña: `cardio123`

---

## 📋 Comandos Útiles

### Iniciar todos los servicios

```powershell
docker-compose up
```

### Iniciar en segundo plano (detached)

```powershell
docker-compose up -d
```

### Ver logs en tiempo real

```powershell
docker-compose logs -f
```

### Ver logs de un servicio específico

```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Detener todos los servicios

```powershell
docker-compose down
```

### Detener y eliminar volúmenes (base de datos)

```powershell
docker-compose down -v
```

### Reconstruir contenedores

```powershell
docker-compose up --build
```

### Ver estado de los contenedores

```powershell
docker-compose ps
```

### Ejecutar comandos dentro de un contenedor

```powershell
# Acceder a MySQL
docker-compose exec mysql mysql -u cardiobeat -p

# Acceder al backend
docker-compose exec backend sh

# Ver archivos del frontend
docker-compose exec frontend sh
```

---

## 🗂️ Estructura de Servicios

### 1. **MySQL** (mysql:8.0)

- Puerto: `3308`
- Usuario: `cardiobeat`
- Password: `cardiobeat123`
- Base de datos: `cardiobeat_db`
- Los datos persisten en un volumen Docker

### 2. **Backend** (Laravel)

- Puerto: `5000`
- API REST completa
- Se conecta automáticamente a MySQL
- Sirve archivos de audio

### 3. **Frontend** (React + Nginx)

- Puerto: `6080`
- Aplicación React compilada
- Nginx como servidor web
- Proxy configurado para API y audios

---

## 🎵 Agregar Audios Cardíacos

1. Descarga los archivos MP3 de sonidos cardíacos
2. Colócalos en la carpeta `backend-laravel/audios/`
3. Los nombres esperados:
   - `normal_heart.mp3`
   - `soplo_estenosis_aortica.mp3`
   - `soplo_insuficiencia_mitral.mp3`
   - `clic_estenosis_mitral.mp3`
   - `galope_s3.mp3`
   - `roce_pericardico.mp3`

**Fuentes recomendadas:**

- https://www.thinklabs.com/heart-sounds/
- https://www.easyauscultation.com/

No necesitas reconstruir los contenedores, los audios se sincronizan automáticamente.

---

## 🔧 Configuración Avanzada

### Cambiar puertos

Edita `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80" # Cambia 6080 a 8080

  backend:
    ports:
      - "5001:5000" # Cambia 5000 a 5001
```

### Cambiar contraseñas

Edita las variables de entorno en `docker-compose.yml`:

```yaml
services:
  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: tu-nueva-password
      MYSQL_PASSWORD: tu-nueva-password

  backend:
    environment:
      DB_PASSWORD: tu-nueva-password
```

---

## 🐛 Solución de Problemas

### Error: "Port is already allocated"

```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :6080

# Cambiar el puerto en docker-compose.yml
```

### Error: "Cannot connect to MySQL"

```powershell
# Esperar a que MySQL inicie completamente
docker-compose logs mysql

# Reiniciar solo el backend
docker-compose restart backend
```

### Base de datos no se crea

```powershell
# Eliminar volumen y recrear
docker-compose down -v
docker-compose up --build
```

### Frontend no carga

```powershell
# Verificar logs
docker-compose logs frontend

# Reconstruir
docker-compose up --build frontend
```

### Resetear todo (empezar de cero)

```powershell
# Detener y eliminar todo
docker-compose down -v

# Eliminar imágenes
docker-compose rm -f

# Reconstruir desde cero
docker-compose up --build
```

---

## 📊 Verificar que Todo Funciona

### 1. Ver contenedores corriendo

```powershell
docker-compose ps
```

Deberías ver 3 servicios `Up`:

- cardiobeat-mysql
- cardiobeat-backend
- cardiobeat-frontend

### 2. Probar el backend

```powershell
curl http://localhost:5000/api/health
```

O abre en el navegador: http://localhost:5000/api/health

### 3. Probar el frontend

Abre en el navegador: http://localhost:6080

### 4. Ver logs

```powershell
docker-compose logs -f
```

---

## 🎯 Características de Esta Configuración

✅ **Todo en uno**: MySQL, Backend y Frontend juntos  
✅ **Persistencia**: Los datos de MySQL se guardan  
✅ **Auto-reinicio**: Si falla, se reinicia automáticamente  
✅ **Health checks**: Verifica que MySQL esté listo  
✅ **Optimizado**: Nginx para el frontend, multi-stage builds  
✅ **Fácil desarrollo**: Sincronización automática de audios  
✅ **Networking**: Los servicios se comunican internamente

---

## 📦 Producción

Para desplegar en producción:

1. Cambia las contraseñas en `docker-compose.yml`
2. Cambia `JWT_SECRET` por algo seguro
3. Usa un proxy reverso como Traefik o Nginx
4. Configura SSL/HTTPS
5. Usa Docker Swarm o Kubernetes para orquestación

---

## 💾 Backup de la Base de Datos

### Crear backup

```powershell
docker-compose exec mysql mysqldump -u cardiobeat -p cardiobeat_db > backup.sql
```

### Restaurar backup

```powershell
docker-compose exec -T mysql mysql -u cardiobeat -p cardiobeat_db < backup.sql
```

---

## 🆘 Ayuda Adicional

**Ver uso de recursos:**

```powershell
docker stats
```

**Limpiar espacio en disco:**

```powershell
docker system prune -a
```

**Actualizar imágenes base:**

```powershell
docker-compose pull
docker-compose up --build
```

---

¡Disfruta de CardioBeat con Docker! 🫀
