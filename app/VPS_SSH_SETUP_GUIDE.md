# Guía de Configuración SSH para VPS

## Resumen
Este documento explica cómo configurar acceso SSH con claves para el VPS y ejecutar los scripts de implementación.

---

## Paso 1: Verificar/Generar Claves SSH

### Verificar si ya tienes claves SSH
```bash
ls ~/.ssh/id_rsa*
```

Si ves `id_rsa` y `id_rsa.pub`, ya tienes claves. Salta al Paso 2.

### Generar nuevas claves SSH (si no existen)
```bash
ssh-keygen -t rsa -b 4096 -C "radio-app-access"
# Presiona Enter para ubicación por defecto
# Presiona Enter para sin passphrase (o crea una si prefieres)
```

---

## Paso 2: Copiar Clave Pública al VPS

Usando `ssh-copy-id` (método recomendado):
```bash
ssh-copy-id root@213.199.39.147
# Cuando pida contraseña, usa: Aintelligence2025
```

Si `ssh-copy-id` no está disponible, usa este comando manual:
```bash
cat ~/.ssh/id_rsa.pub | ssh root@213.199.39.147 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
# Contraseña: Aintelligence2025
```

---

## Paso 3: Verificar Conexión SSH

```bash
ssh root@213.199.39.147
# Si todo está bien, NO debería pedir contraseña
```

Deberías ver algo como:
```
root@vmi2930748:~#
```

Escribe `exit` para salir.

---

## Paso 4: Transferir Scripts al VPS

Desde tu Mac, en el directorio `/Users/camiloalegria/Desktop/VIRAPP/verificador-app/app`:

```bash
# Transferir script de implementación
scp vps-implementation-complete.sh root@213.199.39.147:/root/

# Transferir script de reinicio
scp vps-restart-service.sh root@213.199.39.147:/root/

# Transferir script de limpieza
scp vps-cleanup-flask.sh root@213.199.39.147:/root/
```

---

## Paso 5: Ejecutar Scripts en el VPS

Conéctate al VPS:
```bash
ssh root@213.199.39.147
```

Dentro del VPS, haz los scripts ejecutables y ejecútalos:

### Opción A: Implementación Completa (Recomendada)
```bash
cd /root
chmod +x vps-implementation-complete.sh
./vps-implementation-complete.sh
```

### Opción B: Solo Reiniciar Servicio
```bash
cd /root
chmod +x vps-restart-service.sh
./vps-restart-service.sh
```

### Opción C: Solo Limpiar Flask
```bash
cd /root
chmod +x vps-cleanup-flask.sh
./vps-cleanup-flask.sh
```

---

## Paso 6: Verificar Estado del Servicio

Después de ejecutar los scripts, verifica que el servicio está corriendo:

```bash
# Verificar estado del servicio
systemctl status radio-recorder

# Verificar logs
journalctl -u radio-recorder -f

# Verificar que el puerto 5000 está escuchando
netstat -tlnp | grep 5000
```

Desde tu Mac, prueba el endpoint:
```bash
curl http://213.199.39.147:5000/api/recordings
```

---

## Resolución de Problemas

### Si la conexión SSH sigue pidiendo contraseña:
1. Verifica permisos en el VPS:
```bash
ssh root@213.199.39.147
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

2. Intenta conectar con verbose:
```bash
ssh -v root@213.199.39.147
```

### Si el servicio no inicia:
1. Revisa logs detallados:
```bash
journalctl -u radio-recorder -n 50 --no-pager
```

2. Verifica Python/Flask:
```bash
cd /home/radioapp/radio-recorder
source venv/bin/activate
python -c "import flask; print(flask.__version__)"
```

---

## Comandos Útiles

### Monitorear servicio en tiempo real
```bash
journalctl -u radio-recorder -f
```

### Reiniciar servicio manualmente
```bash
systemctl restart radio-recorder
```

### Ver grabaciones en VPS
```bash
ls -la /home/radioapp/radio-recorder/recordings/
```

### Verificar estructura de carpetas
```bash
find /home/radioapp/radio-recorder/recordings -type f -name "*.mp3" | head -10
```

---

## Resumen de Archivos

| Archivo | Ubicación Local | Ubicación VPS | Propósito |
|---------|----------------|---------------|-----------|
| vps-implementation-complete.sh | app/vps-implementation-complete.sh | /root/vps-implementation-complete.sh | Organizar carpetas + actualizar endpoints |
| vps-restart-service.sh | app/vps-restart-service.sh | /root/vps-restart-service.sh | Reiniciar servicio + verificar |
| vps-cleanup-flask.sh | app/vps-cleanup-flask.sh | /root/vps-cleanup-flask.sh | Eliminar código erróneo de Flask |

---

## Próximos Pasos Después de Ejecutar Scripts

1. **Verificar endpoint de grabaciones:**
   ```bash
   curl http://213.199.39.147:5000/api/recordings
   ```

2. **Verificar endpoint de grabaciones activas:**
   ```bash
   curl http://213.199.39.147:5000/api/active-recordings
   ```

3. **En tu frontend, actualizar el servicio:**
   - Reemplazar `app/lib/recording-service.ts` con `app/lib/recording-service-updated.ts`
   - Actualizar `app/app/(dashboard)/grabaciones/page.tsx` para usar rutas relativas

---

## Contacto y Soporte

Si encuentras problemas:
1. Guarda los logs completos: `journalctl -u radio-recorder -n 100 > logs.txt`
2. Verifica la estructura: `ls -R /home/radioapp/radio-recorder/recordings/`
3. Revisa el archivo Flask: `cat /home/radioapp/radio-recorder/app.py`

¡Éxito con la implementación!