# GUÍA COMPLETA DE IMPLEMENTACIÓN - ORGANIZACIÓN DE GRABACIONES POR FECHA Y RADIO

## 📋 RESUMEN DE LA SOLUCIÓN

Esta guía implementa un sistema completo que organiza automáticamente las grabaciones en la siguiente estructura:

```
/home/radioapp/radio-recorder/recordings/
└── YYYY-MM-DD/                    # Carpeta por día
    └── radio_id/                  # Carpeta por radio
        └── archivo.mp3            # Grabaciones individuales
```

Y sincroniza toda la información con la tabla `recordings` en Supabase, enlazada con `radios` mediante `radio_id`.

---

## 🎯 OBJETIVOS CUMPLIDOS

✅ **Organización automática**: Las grabaciones se organizan por fecha y radio automáticamente  
✅ **Sincronización con Supabase**: Toda la información se guarda en la tabla `recordings`  
✅ **Enlace con radios**: Cada grabación está vinculada a su radio correspondiente  
✅ **Estructura correcta**: Usa la ruta `/home/radioapp/radio-recorder/recordings`  
✅ **Frontend compatible**: Funciona con `http://localhost:3000/radios` y `/grabaciones`

---

## 📁 ARCHIVOS CREADOS

### 1. Servidor VPS (`app/server-vps-organized-correct-path.js`)
- **Ruta correcta**: `/home/radioapp/radio-recorder/recordings`
- **Organización automática**: Crea carpetas por fecha y radio
- **Sincronización con Supabase**: Guarda todos los datos en `recordings`
- **Endpoints**: `/api/start-recording`, `/api/stop-recording`, `/api/recordings`

### 2. Script de Instalación (`app/install-vps-organized-correct-path.sh`)
- Instala Node.js 18, FFmpeg y dependencias
- Crea usuario `radioapp` y estructura de directorios
- Configura servicio systemd `radio-recording-organized.service`
- Abre puerto 5000 en firewall

### 3. Esta Guía (`app/GUIA_IMPLEMENTACION_ORGANIZADA_FINAL.md`)
- Instrucciones paso a paso para implementación

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Preparar el VPS

**En tu computadora local**, sube los archivos al VPS:

```bash
# 1. Conectar al VPS
ssh root@213.199.39.147

# 2. Crear directorio de la aplicación
mkdir -p /root/verificador-app/app

# 3. Salir del VPS
exit

# 4. Subir el archivo del servidor (desde tu computadora)
scp app/server-vps-organized-correct-path.js root@213.199.39.147:/root/verificador-app/app/

# 5. Subir el script de instalación
scp app/install-vps-organized-correct-path.sh root@213.199.39.147:/root/

# 6. Conectar nuevamente al VPS
ssh root@213.199.39.147
```

### PASO 2: Ejecutar Instalación en VPS

```bash
# 1. Dar permisos de ejecución
chmod +x /root/install-vps-organized-correct-path.sh

# 2. Ejecutar instalación
bash /root/install-vps-organized-correct-path.sh
```

**Durante la instalación:**
- El script actualizará el sistema
- Instalará Node.js 18 y FFmpeg
- Creará el usuario `radioapp`
- Configurará la estructura de directorios
- Instalará el servicio systemd

### PASO 3: Configurar Variables de Entorno

**Después de la instalación**, edita el archivo de entorno:

```bash
# Editar archivo de entorno
nano /home/radioapp/radio-recorder/app/.env
```

**Reemplaza con tus credenciales reales de Supabase:**

```env
# Configuración de Supabase
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuración del servidor
PORT=5000
RECORDINGS_DIR=/home/radioapp/radio-recorder/recordings
```

**Para obtener tus credenciales de Supabase:**
1. Ve a https://supabase.com
2. Abre tu proyecto
3. Ve a Settings → API
4. Copia "Project URL" y "anon public key"

### PASO 4: Reiniciar Servicio

```bash
# Recargar configuración y reiniciar
systemctl daemon-reload
systemctl restart radio-recording-organized.service

# Verificar estado
systemctl status radio-recording-organized.service

# Ver logs
journalctl -u radio-recording-organized -f
```

Deberías ver algo como:
```
🚀 Servidor de grabación organizado iniciado en puerto 5000
📁 Directorio base: /home/radioapp/radio-recorder/recordings
📊 Estructura: /recordings/YYYY-MM-DD/radio_id/
```

### PASO 5: Verificar Endpoints

**En el VPS**, prueba los endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Lista de grabaciones (vacía al inicio)
curl http://localhost:5000/api/recordings
```

---

## 🔧 CONFIGURAR FRONTEND (LOCAL)

### PASO 6: Actualizar API del Frontend

**Archivo**: `app/app/api/recording-vps-fixed/route.ts`

Asegúrate de que use el endpoint correcto del VPS:

```typescript
// Asegúrate de que VPS_API_URL apunte al VPS
const VPS_API_URL = 'http://213.199.39.147:5000';

// El resto del código debe mantenerse igual
```

### PASO 7: Probar Grabación

1. **Inicia tu frontend local**:
```bash
cd app
npm run dev
```

2. **Abre el navegador**: http://localhost:3000/radios

3. **Inicia una grabación**:
   - Busca una radio (ej: "fmmas")
   - Haz clic en "Grabar"
   - Verifica que el estado cambia a "Grabando"

4. **Detén la grabación**:
   - Haz clic en "Detener"
   - Espera unos segundos

### PASO 8: Verificar en VPS

**En el VPS**, verifica que se creó el archivo:

```bash
# Verificar estructura de directorios
ls -la /home/radioapp/radio-recorder/recordings/

# Ver contenido (reemplaza YYYY-MM-DD con la fecha actual)
ls -la /home/radioapp/radio-recorder/recordings/2025-12-03/

# Ver logs del servicio
journalctl -u radio-recording-organized -n 20
```

Deberías ver algo como:
```
/home/radioapp/radio-recorder/recordings/2025-12-03/radio_11/
└── radio_11_2025-12-03-16-30-00_1234567890.mp3
```

### PASO 9: Verificar en Supabase

1. Ve a https://supabase.com
2. Abre tu proyecto
3. Ve a "Table Editor"
4. Abre la tabla `recordings`
5. Deberías ver el nuevo registro con:
   - `radio_id`: ID de la radio en Supabase
   - `filename`: Nombre del archivo
   - `file_path`: Ruta completa en el VPS
   - `file_size`: Tamaño en bytes
   - `metadata`: Información completa de la radio

---

## 📊 ESTRUCTURA DE DATOS EN SUPABASE

### Tabla `radios` (debe existir)
```sql
id (uuid) - ID único de la radio
name (text) - Nombre de la radio
region (text) - Región
description (text) - Ciudad/Descripción
platform (text) - Plataforma/Programadora
stream_url (text) - URL del stream
vps_id (text) - ID en el VPS (ej: "11", "fmmas")
status (text) - Estado activo/inactivo
```

### Tabla `recordings` (debe existir)
```sql
id (uuid) - ID único de la grabación
radio_id (uuid) - FK a radios.id
filename (text) - Nombre del archivo
file_path (text) - Ruta completa en el VPS
file_size (bigint) - Tamaño en bytes
duration_seconds (int) - Duración en segundos
recorded_at (timestamp) - Fecha de grabación
metadata (json) - Información adicional
created_at (timestamp) - Fecha de creación
```

---

## 🔄 FLUJO COMPLETO

1. **Usuario inicia grabación** en http://localhost:3000/radios
2. **Frontend llama a `/api/recording-vps-fixed`** (local)
3. **API local llama a VPS**: `POST http://213.199.39.147:5000/api/start-recording`
4. **VPS crea estructura**:
   - Crea carpeta `/home/radioapp/radio-recorder/recordings/2025-12-03/`
   - Crea subcarpeta `radio_11/`
   - Inicia FFmpeg para grabar
5. **FFmpeg graba** el stream y guarda en la carpeta correcta
6. **Al completar**, el servidor:
   - Obtiene info de la radio desde Supabase
   - Guarda registro en tabla `recordings`
   - Guarda metadata completa
7. **Usuario detiene grabación** o se completa automáticamente
8. **Frontend muestra** la grabación en http://localhost:3000/grabaciones
9. **Usuario puede descargar** el archivo desde el VPS

---

## 🛠️ COMANDOS ÚTILES

### Verificar servicio en VPS
```bash
# Estado del servicio
systemctl status radio-recording-organized

# Ver logs en tiempo real
journalctl -u radio-recording-organized -f

# Ver últimas 50 líneas
journalctl -u radio-recording-organized -n 50

# Reiniciar servicio
systemctl restart radio-recording-organized
```

### Verificar grabaciones en VPS
```bash
# Ver estructura completa
tree /home/radioapp/radio-recorder/recordings/

# O si no tienes tree:
find /home/radioapp/radio-recorder/recordings/ -type f -name "*.mp3"

# Ver tamaño total
du -sh /home/radioapp/radio-recorder/recordings/

# Ver espacio disponible
df -h /home/
```

### Probar endpoints del VPS
```bash
# Health check
curl http://213.199.39.147:5000/health

# Lista de grabaciones
curl http://213.199.39.147:5000/api/recordings

# Grabaciones activas
curl http://213.199.39.147:5000/api/active-recordings
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: El servicio no inicia
```bash
# Ver errores
journalctl -u radio-recording-organized -n 20

# Verificar permisos
ls -la /home/radioapp/radio-recorder/

# Verificar Node.js
node --version

# Verificar FFmpeg
ffmpeg -version
```

### Problema: No se crean archivos
```bash
# Verificar directorio
ls -la /home/radioapp/radio-recorder/recordings/

# Verificar permisos
ls -ld /home/radioapp/radio-recorder/recordings/

# Ver logs detallados
journalctl -u radio-recording-organized -f
```

### Problema: No se guarda en Supabase
```bash
# Verificar variables de entorno
cat /home/radioapp/radio-recorder/app/.env

# Verificar conectividad
curl -I https://tuproyecto.supabase.co

# Ver logs de errores
journalctl -u radio-recording-organized | grep -i "supabase\|error"
```

### Problema: Frontend no puede conectar
```bash
# Verificar firewall en VPS
ufw status

# Verificar que el servicio escucha en 0.0.0.0
netstat -tlnp | grep 5000

# Verificar que el puerto está abierto
telnet 213.199.39.147 5000
```

---

## ✅ VERIFICACIÓN FINAL

Después de completar la instalación, verifica:

1. **✅ Servicio activo**: `systemctl status radio-recording-organized` muestra "active (running)"
2. **✅ Health check**: `curl http://213.199.39.147:5000/health` responde con status "OK"
3. **✅ Estructura creada**: `ls -la /home/radioapp/radio-recorder/recordings/` existe
4. **✅ Frontend funciona**: Puedes iniciar/detener grabaciones desde http://localhost:3000/radios
5. **✅ Archivos creados**: Las grabaciones aparecen en `/home/radioapp/radio-recorder/recordings/YYYY-MM-DD/radio_id/`
6. **✅ Supabase sincronizado**: Los registros aparecen en la tabla `recordings`
7. **✅ Descarga funciona**: Puedes descargar archivos desde `/grabaciones`

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa los logs**: `journalctl -u radio-recording-organized -n 50`
2. **Verifica la instalación**: Ejecuta el script de instalación nuevamente
3. **Comprueba permisos**: `ls -la /home/radioapp/radio-recorder/`
4. **Testea endpoints**: Usa `curl` para probar los endpoints del VPS

---

## 🎉 LISTO PARA USAR

Una vez completados todos los pasos, tu sistema estará completamente funcional con:
- ✅ Organización automática por fecha y radio
- ✅ Sincronización completa con Supabase
- ✅ Frontend funcional en http://localhost:3000
- ✅ Backend VPS en http://213.199.39.147:5000
- ✅ Estructura de archivos correcta y mantenible

¡Todo está listo para grabar organizadamente!