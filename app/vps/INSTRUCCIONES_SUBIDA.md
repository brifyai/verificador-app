# 📤 INSTRUCCIONES PARA SUBIR ARCHIVOS AL VPS

## 🎯 Archivos Modificados

Los siguientes archivos han sido modificados con las nuevas funcionalidades:

1. ✅ **enhanced-scheduler.js** - Agregadas 4 nuevas funciones:
   - `findScheduleBySessionId()` - Buscar schedule por sessionId
   - `pauseSchedule()` - Pausar grabaciones
   - `resumeSchedule()` - Reanudar grabaciones
   - `stopAndDeleteSchedule()` - Detener y eliminar completamente

2. ✅ **enhanced-server.js** - Agregados 3 nuevos endpoints:
   - `POST /api/pause-schedule` - Pausar schedule
   - `POST /api/resume-schedule` - Reanudar schedule
   - `POST /api/stop-schedule` - Detener y eliminar schedule

---

## 📋 PASOS PARA SUBIR AL VPS

### **Opción 1: Usando SCP (Recomendado)**

```bash
# 1. Conectarse al VPS y hacer backup
ssh root@173.249.26.38
cd /root
cp enhanced-scheduler.js enhanced-scheduler.js.backup
cp enhanced-server.js enhanced-server.js.backup
exit

# 2. Subir los archivos modificados desde tu máquina local
cd "d:\Trabajo Radios\repositorio-2\ProyectoOndaVerificada\app\vps"

scp enhanced-scheduler.js root@173.249.26.38:/root/enhanced-scheduler.js
scp enhanced-server.js root@173.249.26.38:/root/enhanced-server.js

# 3. Reiniciar el servidor en el VPS
ssh root@173.249.26.38
pm2 restart enhanced-server
pm2 logs enhanced-server
```

### **Opción 2: Usando WinSCP (Windows)**

1. Abre **WinSCP**
2. Conecta al VPS:
   - Host: `173.249.26.38`
   - Usuario: `root`
   - Contraseña: [tu contraseña]
3. Navega a `/root`
4. **Haz backup primero**:
   - Renombra `enhanced-scheduler.js` → `enhanced-scheduler.js.backup`
   - Renombra `enhanced-server.js` → `enhanced-server.js.backup`
5. **Sube los archivos**:
   - Arrastra `enhanced-scheduler.js` desde tu PC al VPS
   - Arrastra `enhanced-server.js` desde tu PC al VPS
6. **Reinicia el servidor**:
   ```bash
   pm2 restart enhanced-server
   ```

### **Opción 3: Copiar y Pegar Manualmente**

```bash
# 1. Conectarse al VPS
ssh root@173.249.26.38

# 2. Hacer backup
cd /root
cp enhanced-scheduler.js enhanced-scheduler.js.backup
cp enhanced-server.js enhanced-server.js.backup

# 3. Editar enhanced-scheduler.js
nano enhanced-scheduler.js
# Pega el contenido completo del archivo
# Guarda: Ctrl+X, Y, Enter

# 4. Editar enhanced-server.js
nano enhanced-server.js
# Pega el contenido completo del archivo
# Guarda: Ctrl+X, Y, Enter

# 5. Reiniciar
pm2 restart enhanced-server
pm2 logs enhanced-server
```

---

## 🧪 VERIFICAR QUE FUNCIONA

### **1. Verificar que el servidor inició correctamente**

```bash
ssh root@173.249.26.38
pm2 logs enhanced-server --lines 50
```

Deberías ver:
```
🚀 VPS Radio Recording API v2.0-Enhanced iniciado
📡 Escuchando en: http://0.0.0.0:3000
🤖 Sistema mejorado: ACTIVO
```

### **2. Probar los nuevos endpoints**

```bash
# Desde tu máquina local (PowerShell):

# Ver endpoints disponibles
Invoke-RestMethod -Uri "http://173.249.26.38:3000" -Method GET

# Deberías ver los 3 nuevos endpoints listados:
# - POST /api/pause-schedule
# - POST /api/resume-schedule
# - POST /api/stop-schedule
```

### **3. Probar desde el Dashboard**

1. **Crea un monitoreo** desde el dashboard
2. **Verifica los logs del VPS**:
   ```bash
   pm2 logs enhanced-server
   ```
   Deberías ver:
   ```
   📥 Nueva programación recibida del dashboard
   📊 Status: ACTIVE
   🔑 Sessions: 2
   ```

3. **Prueba el botón PAUSAR**:
   - Haz clic en "Pausar" en el dashboard
   - Logs esperados en VPS:
   ```
   ⏸️ [PAUSE] Recibido - sessionId: cmgl8uxxx...
   ⏸️ Pausando schedule para sessionId: cmgl8uxxx...
   ✅ Schedule pausado en archivo: /root/config/schedule_xxx.json
   ✅ Schedule pausado: cmgl8uxxx... (0 grabaciones detenidas)
   ✅ Schedule pausado exitosamente: cmgl8uxxx...
   ```

4. **Prueba el botón REANUDAR**:
   - Logs esperados:
   ```
   ▶️ [RESUME] Recibido - sessionId: cmgl8uxxx...
   ▶️ Reanudando schedule para sessionId: cmgl8uxxx...
   ✅ Schedule reanudado en archivo: /root/config/schedule_xxx.json
   ✅ Schedule reanudado: cmgl8uxxx...
   ```

5. **Prueba el botón DETENER**:
   - Logs esperados:
   ```
   🛑 [STOP] Recibido - sessionId: cmgl8uxxx...
   🛑 Deteniendo y eliminando schedule para sessionId: cmgl8uxxx...
   ✅ 0 grabaciones detenidas
   ✅ 7 trabajos cron detenidos
   ✅ Archivo de configuración eliminado: schedule_xxx.json
   ✅ Schedule completamente eliminado: cmgl8uxxx...
   ```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### **Error: "Schedule no encontrado"**

**Causa**: El sessionId no coincide con ningún schedule guardado.

**Solución**:
```bash
# Ver schedules existentes
ls -la /root/config/

# Ver contenido de un schedule
cat /root/config/schedule_*.json | grep -A 5 "sessions"
```

### **Error: "Cannot find module"**

**Causa**: Falta alguna dependencia.

**Solución**:
```bash
cd /root
npm install
pm2 restart enhanced-server
```

### **El servidor no inicia**

**Solución**:
```bash
# Ver errores completos
pm2 logs enhanced-server --err --lines 100

# Reiniciar desde cero
pm2 delete enhanced-server
pm2 start enhanced-server.js --name enhanced-server
```

---

## ✅ CHECKLIST FINAL

Antes de dar por terminado, verifica:

- [ ] Archivos subidos al VPS
- [ ] Backup de archivos originales creado
- [ ] Servidor reiniciado con `pm2 restart`
- [ ] Logs muestran "Sistema mejorado: ACTIVO"
- [ ] Endpoint raíz (`http://173.249.26.38:3000`) muestra los 3 nuevos endpoints
- [ ] Crear monitoreo desde dashboard funciona
- [ ] Botón "Pausar" funciona y se ve en logs
- [ ] Botón "Reanudar" funciona y se ve en logs
- [ ] Botón "Detener" funciona y elimina el archivo de config

---

## 📞 SOPORTE

Si algo no funciona:

1. **Revisa los logs del VPS**: `pm2 logs enhanced-server`
2. **Revisa los logs del dashboard**: Consola del navegador (F12)
3. **Verifica la conexión**: `curl http://173.249.26.38:3000`

**¡Todo listo para subir al VPS!** 🚀
