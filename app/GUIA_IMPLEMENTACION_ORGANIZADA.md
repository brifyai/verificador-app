# 📋 GUÍA COMPLETA: Organización de Grabaciones por Fecha y Radio

## 🎯 OBJETIVO

Implementar un sistema que:
1. **Organice automáticamente** las grabaciones en carpetas por fecha y radio
2. **Guarde toda la información** en la tabla `recordings` vinculada con `radios`
3. **Sincronice automáticamente** con Supabase cada vez que se crea una grabación

## 📁 ESTRUCTURA DE ARCHIVOS

```
/opt/radio-recording-organized/recordings/
├── 2025-12-02/
│   ├── mijm9xci/          # Radio ID del VPS
│   │   └── radio_mijm9xci_...mp3
│   └── mijm9xsi/
│       └── radio_mijm9xsi_...mp3
├── 2025-12-03/
│   └── ...
```

## 🔧 ARCHIVOS CREADOS

### 1. `server-vps-organized.js`
**Ubicación:** `app/server-vps-organized.js`

Servidor completo que:
- ✅ Organiza grabaciones automáticamente por fecha y radio
- ✅ Guarda información en Supabase automáticamente
- ✅ Crea carpetas automáticamente: `/recordings/YYYY-MM-DD/radio_id/`
- ✅ Sincroniza datos de la radio desde Supabase
- ✅ Endpoints compatibles con el frontend actual

**Endpoints principales:**
- `GET /health` - Health check
- `GET /api/recordings` - Lista todas las grabaciones organizadas
- `POST /api/start-recording` - Inicia grabación con organización automática
- `POST /api/stop-recording` - Detiene grabación
- `GET /recordings/:date/:radioId/:filename` - Descarga archivo

### 2. `install-vps-organized.sh`
**Ubicación:** `app/install-vps-organized.sh`

Script de instalación automatizado que:
- ✅ Detiene el servicio anterior
- ✅ Crea backup de configuración
- ✅ Instala dependencias
- ✅ Configura el nuevo servidor
- ✅ Crea servicio systemd
- ✅ Inicia el servicio automáticamente

### 3. `organize-vps-recordings-by-date.js`
**Ubicación:** `app/organize-vps-recordings-by-date.js`

Script para organizar grabaciones existentes:
- ✅ Lee grabaciones del VPS
- ✅ Las organiza por fecha y radio
- ✅ Sincroniza con Supabase
- ✅ Mueve archivos a la nueva estructura

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Preparar el VPS

1. **Conectar al VPS:**
```bash
ssh root@213.199.39.147
```

2. **Navegar al directorio de la app:**
```bash
cd /root/verificador-app/app
```

3. **Subir los archivos nuevos** (desde tu máquina local):
```bash
# En tu máquina local
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app
scp server-vps-organized.js install-vps-organized.sh root@213.199.39.147:/root/verificador-app/app/
```

### PASO 2: Instalar el nuevo servidor

1. **Hacer ejecutable el script:**
```bash
chmod +x install-vps-organized.sh
```

2. **Ejecutar la instalación:**
```bash
./install-vps-organized.sh
```

3. **Configurar credenciales de Supabase:**
```bash
nano /opt/radio-recording-organized/.env
```

**Contenido del archivo .env:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=5000
```

4. **Reiniciar el servicio:**
```bash
systemctl restart radio-recording-organized.service
```

### PASO 3: Verificar la instalación

1. **Verificar estado del servicio:**
```bash
systemctl status radio-recording-organized.service
```

2. **Ver logs en tiempo real:**
```bash
journalctl -u radio-recording-organized.service -f
```

3. **Probar el endpoint de health:**
```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-03T14:30:00.000Z",
  "active_recordings": 0,
  "uptime": 10.5
}
```

### PASO 4: Actualizar el frontend (si es necesario)

**Archivo:** `app/app/api/recordings-from-supabase/route.ts`

Verifica que el endpoint apunte al nuevo servidor:

```typescript
const VPS_API_URL = 'http://213.199.39.147:5000';
```

**Nota:** El nuevo servidor es compatible con el frontend existente, no deberían necesitarse cambios.

### PASO 5: Probar el sistema completo

1. **Iniciar una grabación desde el frontend:**
   - Ve a `http://localhost:3000/radios`
   - Selecciona una radio
   - Haz clic en "Iniciar Grabación"

2. **Verificar en el VPS:**
```bash
# Ver la estructura de carpetas creadatree /opt/radio-recording-organized/recordings

# Ver logsjournalctl -u radio-recording-organized.service -f
```

3. **Verificar en Supabase:**
   - Revisa la tabla `recordings`
   - Debería aparecer una nueva entrada con:
     - `radio_id` correcto
     - `file_path` con la nueva estructura
     - `metadata` con información de la radio

## 📊 VERIFICACIÓN DE DATOS

### Verificar estructura en el VPS:
```bash
# Listar grabaciones organizadas
curl http://213.199.39.147:5000/api/recordings
```

### Verificar grabaciones por fecha:
```bash
# Grabaciones de un día específico
curl http://213.199.39.147:5000/recordings/by-date/2025-12-03
```

### Verificar en Supabase:
```sql
-- Ver todas las grabaciones organizadas
SELECT 
    r.id,
    r.filename,
    r.file_path,
    r.file_size,
    r.recorded_at,
    r.metadata,
    rad.name as radio_name,
    rad.region as radio_region
FROM recordings r
JOIN radios rad ON r.radio_id = rad.id
ORDER BY r.recorded_at DESC;
```

## 🔍 TROUBLESHOOTING

### Problema: El servicio no inicia
```bash
# Ver logs detallados
journalctl -u radio-recording-organized.service -n 50 --no-pager

# Verificar dependencias
cd /opt/radio-recording-organized
npm list
```

### Problema: No se conecta a Supabase
```bash
# Verificar variables de entorno
cat /opt/radio-recording-organized/.env

# Probar conexión manual
curl -X GET "https://your-project.supabase.co/rest/v1/radios?select=*" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### Problema: No crea carpetas automáticamente
```bash
# Verificar permisos
ls -la /opt/radio-recording-organized/

# Verificar logs
journalctl -u radio-recording-organized.service -f | grep -i "carpeta\|directorio"
```

## 📈 BENEFICIOS DE LA NUEVA ORGANIZACIÓN

1. **Estructura clara:** Las grabaciones se organizan automáticamente por fecha y radio
2. **Fácil acceso:** Puedes navegar fácilmente por las carpetas para encontrar grabaciones
3. **Sincronización automática:** Cada grabación se guarda automáticamente en Supabase
4. **Información completa:** Se guarda toda la información de la radio (nombre, región, ciudad, programadora)
5. **Escalable:** La estructura de carpetas permite manejar miles de grabaciones sin problemas
6. **Compatible:** Funciona con el frontend existente sin cambios

## 🔄 MIGRACIÓN DE GRABACIONES EXISTENTES

Si tienes grabaciones antiguas que quieres organizar:

```bash
# Ejecutar el script de organización
node organize-vps-recordings-by-date.js
```

Este script:
1. Lee las grabaciones existentes
2. Las organiza por fecha y radio
3. Las mueve a la nueva estructura
4. Guarda la información en Supabase

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisa los logs:**
```bash
journalctl -u radio-recording-organized.service -f
```

2. **Verifica la estructura:**
```bash
tree /opt/radio-recording-organized/recordings
```

3. **Prueba endpoints:**
```bash
curl http://localhost:5000/api/recordings
```

4. **Consulta Supabase:**
```sql
SELECT * FROM recordings ORDER BY recorded_at DESC LIMIT 10;
```

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Subir archivos al VPS
- [ ] Ejecutar script de instalación
- [ ] Configurar credenciales de Supabase
- [ ] Reiniciar servicio
- [ ] Verificar health endpoint
- [ ] Probar grabación desde frontend
- [ ] Verificar estructura de carpetas creada
- [ ] Verificar registro en Supabase
- [ ] (Opcional) Migrar grabaciones antiguas

---

**🎉 ¡Listo! Tu sistema ahora organizará automáticamente las grabaciones por fecha y radio, y guardará toda la información en Supabase!**