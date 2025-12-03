# 🚀 Guía de Comandos VPS - Implementación de Organización de Grabaciones

## 📋 PRERREQUISITOS

Antes de comenzar, necesitas:
- ✅ Acceso SSH al VPS (usuario: `radioapp`)
- ✅ IP del VPS: `213.199.39.147`
- ✅ Script de implementación: `vps-implementation-complete.sh`
- ✅ Conexión a internet estable

---

## 🔐 1. CONECTARSE AL VPS

### Opción A: Conexión directa (más simple)
```bash
ssh radioapp@213.199.39.147
```

### Opción B: Con conexión persistente (recomendado para largas operaciones)
```bash
ssh -o ServerAliveInterval=60 radioapp@213.199.39.147
```

**Explicación:**
- `radioapp` = Usuario en el VPS
- `213.199.39.147` = IP del VPS
- `-o ServerAliveInterval=60` = Mantiene la conexión activa cada 60 segundos

---

## 📤 2. TRANSFERIR SCRIPT AL VPS

### Método 1: Desde tu máquina local (recomendado)
Abre una terminal nueva (NO en el VPS) y ejecuta:

```bash
# Navegar al directorio donde está el script
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app

# Transferir script al VPS
scp ./vps-implementation-complete.sh radioapp@213.199.39.147:/home/radioapp/
```

### Método 2: Si ya estás conectado al VPS
Copia y pega el contenido del script directamente:

```bash
# En el VPS, crear el archivo
nano /home/radioapp/vps-implementation-complete.sh

# Pegar todo el contenido del script
# Guardar con: Ctrl+X, luego Y, luego Enter
```

---

## 🔍 3. VERIFICAR CONECTIVIDAD ANTES DE EMPEZAR

```bash
# Verificar que el VPS responde
ping -c 3 213.199.39.147

# Verificar que el servicio de grabaciones está corriendo
curl -s http://213.199.39.147:5000/api/health | jq

# Verificar espacio en disco disponible
ssh radioapp@213.199.39.147 "df -h /home/radioapp/"
```

---

## ⚡ 4. EJECUTAR LA IMPLEMENTACIÓN

### Paso 4.1: Conectarse al VPS
```bash
ssh radioapp@213.199.39.147
```

### Paso 4.2: Navegar al directorio
```bash
cd /home/radioapp
```

### Paso 4.3: Dar permisos de ejecución al script
```bash
chmod +x vps-implementation-complete.sh
```

### Paso 4.4: Ejecutar el script (modo interactivo)
```bash
./vps-implementation-complete.sh
```

### Paso 4.5: Ejecutar en modo desatendido (si confías en el script)
```bash
./vps-implementation-complete.sh --force
```

---

## 📊 5. COMANDOS DE MONITOREO DURANTE LA EJECUCIÓN

### En una terminal SEPARADA (mantener abierta durante la ejecución):

```bash
# Monitorear logs del servicio de grabaciones
ssh radioapp@213.199.39.147 "tail -f /home/radioapp/radio-recorder/logs/radio-recorder.log"

# Monitorear uso de CPU y memoria
ssh radioapp@213.199.39.147 "htop"

# Monitorear el progreso de organización de archivos
ssh radioapp@213.199.39.147 "tail -f /home/radioapp/organization.log"
```

---

## ✅ 6. VERIFICAR RESULTADOS DESPUÉS DE LA EJECUCIÓN

### 6.1 Verificar nueva estructura de carpetas
```bash
# Listar grabaciones organizadas por fecha
ssh radioapp@213.199.39.147 "ls -la /home/radioapp/radio-recorder/recordings/"

# Verificar una fecha específica (ej: hoy)
TODAY=$(date +%Y-%m-%d)
ssh radioapp@213.199.39.147 "ls -la /home/radioapp/radio-recorder/recordings/${TODAY}/"

# Contar total de grabaciones organizadas
ssh radioapp@213.199.39.147 "find /home/radioapp/radio-recorder/recordings/ -name '*.mp3' | wc -l"
```

### 6.2 Verificar endpoint de grabaciones
```bash
# Obtener lista de grabaciones con rutas relativas
curl -s http://213.199.39.147:5000/api/recordings | jq

# Verificar que devuelve el campo 'path'
curl -s http://213.199.39.147:5000/api/recordings | jq '.recordings[0].path'
```

### 6.3 Verificar endpoint de descarga
```bash
# Probar descarga de archivo específico
# Reemplaza {path} con una ruta real del JSON anterior
curl -o test-download.mp3 "http://213.199.39.147:5000/api/download/2025-12-01/radio_id/archivo.mp3"

# Verificar archivo descargado
ls -lh test-download.mp3
file test-download.mp3
```

### 6.4 Verificar estado del servicio
```bash
# Verificar que el servicio está corriendo
ssh radioapp@213.199.39.147 "sudo systemctl status radio-recorder"

# Verificar logs recientes
ssh radioapp@213.199.39.147 "sudo journalctl -u radio-recorder -n 50 --no-pager"
```

---

## 🔄 7. COMANDOS DE RECUPERACIÓN (SI ALGO SALE MAL)

### 7.1 Restaurar desde backup (automático)
```bash
# El script crea un backup automáticamente en:
# /home/radioapp/backups/radio-recordings-YYYY-MM-DD-HHMMSS.tar.gz

# Para restaurar manualmente:
ssh radioapp@213.199.39.147 "
cd /home/radioapp && \
tar -xzf backups/radio-recordings-20251201-120000.tar.gz && \
sudo systemctl restart radio-recorder
"
```

### 7.2 Reiniciar servicio manualmente
```bash
ssh radioapp@213.199.39.147 "sudo systemctl restart radio-recorder"
```

### 7.3 Verificar errores específicos
```bash
# Verificar errores en el servicio
ssh radioapp@213.199.39.147 "sudo journalctl -u radio-recorder -n 100 --no-pager | grep -i error"

# Verificar permisos de archivos
ssh radioapp@213.199.39.147 "ls -la /home/radioapp/radio-recorder/recordings/"
```

---

## 📈 8. COMANDOS DE VERIFICACIÓN FINAL EN FRONTEND

Después de ejecutar todo en el VPS, verifica en tu máquina local:

```bash
# Navegar al directorio de la app
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app

# Verificar que el frontend recibe grabaciones con rutas relativas
curl -s http://localhost:3000/api/recordings | jq

# Probar descarga desde el frontend
curl -o test-frontend.mp3 "http://localhost:3000/api/download/2025-12-01/radio_id/archivo.mp3"
```

---

## 🎯 9. RESUMEN DE COMANDOS RÁPIDOS

```bash
# 🔹 CONEXIÓN Y TRANSFERENCIA (Terminal local)
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app
scp ./vps-implementation-complete.sh radioapp@213.199.39.147:/home/radioapp/

# 🔹 EJECUCIÓN (Terminal VPS)
ssh radioapp@213.199.39.147
cd /home/radioapp
chmod +x vps-implementation-complete.sh
./vps-implementation-complete.sh

# 🔹 VERIFICACIÓN (Terminal local)
curl -s http://213.199.39.147:5000/api/recordings | jq '.recordings[0].path'
```

---

## ⚠️ 10. NOTAS IMPORTANTES

1. **Tiempo de ejecución**: El script puede tardar 5-15 minutos dependiendo de la cantidad de grabaciones
2. **Backup automático**: El script crea un backup antes de modificar nada
3. **Reinicio de servicio**: El servicio se reinicia automáticamente al final
4. **Logs**: Toda la ejecución se guarda en `/home/radioapp/organization.log`
5. **Permisos**: Asegúrate de tener permisos sudo para reiniciar servicios

---

## 📞 11. SI NECESITAS AYUDA

Si algo sale mal, ejecuta estos comandos para diagnosticar:

```bash
# Enviar logs de error
ssh radioapp@213.199.39.147 "cat /home/radioapp/organization.log" > error-log.txt

# Verificar estructura actual
ssh radioapp@213.199.39.147 "tree /home/radioapp/radio-recorder/recordings/ -L 3" > structure.txt

# Verificar estado del servicio
ssh radioapp@213.199.39.147 "sudo systemctl status radio-recorder" > service-status.txt
```

---

**¡Listo para ejecutar!** Sigue los comandos en orden y la implementación estará completa en minutos.