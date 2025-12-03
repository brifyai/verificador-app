# 🚨 INSTRUCCIONES CRÍTICAS - LIMPIEZA VPS

## ❌ PROBLEMA ACTUAL
El servicio `radio-recorder` está en **crash loop** porque el archivo Flask tiene código erróneo.

## ✅ SOLUCIÓN
Ejecutar el script `vps-cleanup-flask.sh` que elimina el código problemático.

---

## 📋 PASOS EN 2 PARTES

### **PARTE 1: EN TU MAC LOCAL** (Prompt: `camiloalegria@MacBook-Pro`)

```bash
# PASO 1: Asegurarte de estar en tu Mac (NO en el VPS)
# Tu prompt debe lucir así: camiloalegria@MacBook-Pro-de-Camilo ~ %
# Si ves "root@vmi2930748" ejecuta: exit

# PASO 2: Ir al directorio de la app
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app

# PASO 3: Transferir el script al VPS
scp ./vps-cleanup-flask.sh root@213.199.39.147:/root/

# PASO 4: Conectar al VPS y ejecutar el script
ssh root@213.199.39.147
```

---

### **PARTE 2: DENTRO DEL VPS** (Prompt: `root@vmi2930748`)

```bash
# PASO 5: Dar permisos de ejecución
chmod +x /root/vps-cleanup-flask.sh

# PASO 6: Ejecutar el script de limpieza
cd /root && ./vps-cleanup-flask.sh

# PASO 7: Verificar que el servicio esté corriendo
systemctl status radio-recorder.service

# PASO 8: Si no está activo, ver logs
journalctl -u radio-recorder.service -f
```

---

## 🔍 VERIFICACIÓN FINAL

```bash
# Desde tu MAC (después de salir del VPS con 'exit')
curl http://213.199.39.147:5000/api/recordings

# Deberías ver JSON con grabaciones, no un error de conexión
```

---

## ⚠️ ERRORES COMUNES A EVITAR

| ❌ MAL | ✅ BIEN |
|--------|---------|
| Ejecutar `cd /Users/...` dentro del VPS | Ejecutar `cd /Users/...` en tu Mac |
| `scp` dentro del VPS | `scp` en tu Mac |
| Comando completo con `&&` en el VPS | Dividir comandos: primero `scp`, luego `ssh` |
| No verificar el prompt antes de ejecutar | Verificar siempre `camiloalegria@MacBook` vs `root@vmi` |

---

## 📦 COMANDOS LISTOS PARA COPIAR

### Mac Local:
```bash
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app && scp ./vps-cleanup-flask.sh root@213.199.39.147:/root/
```

### VPS (después de `ssh root@213.199.39.147`):
```bash
cd /root && chmod +x vps-cleanup-flask.sh && ./vps-cleanup-flask.sh && systemctl status radio-recorder.service
```

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar el script, el servicio debe estar **active (running)** y el endpoint debe responder:

```json
{
  "recordings": [...],
  "count": X,
  "status": "success"
}