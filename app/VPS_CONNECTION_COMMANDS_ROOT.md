# 🚀 Guía de Comandos VPS - Implementación de Organización de Grabaciones

## 📋 CREDENCIALES CORRECTAS

- **Usuario**: `root`
- **Contraseña**: `Aintelligence2025`
- **IP**: `213.199.39.147`

---

## 📤 1. TRANSFERIR SCRIPT AL VPS

Abre una **nueva terminal** en tu Mac y ejecuta:

```bash
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app
scp ./vps-implementation-complete.sh root@213.199.39.147:/root/
```

**Contraseña cuando te la pidan**: `Aintelligence2025`

---

## 🔐 2. CONECTARTE AL VPS

```bash
ssh root@213.199.39.147
```

**Contraseña**: `Aintelligence2025`

---

## ⚡ 3. EJECUTAR EL SCRIPT

Una vez conectado al VPS (verás `root@vps:~#`), ejecuta:

```bash
cd /root
chmod +x vps-implementation-complete.sh
./vps-implementation-complete.sh
```

Responde `yes` cuando el script te pida confirmación.

---

## ✅ 4. VERIFICAR RESULTADOS

Después de que termine (5-10 minutos), verifica:

```bash
# Verificar nueva estructura de carpetas
ls -la /root/radio-recorder/recordings/

# Verificar que el endpoint devuelve rutas relativas
curl -s http://213.199.39.147:5000/api/recordings | jq '.recordings[0].path'
```

---

## 🎯 COMANDO RÁPIDO (TODO EN UNO)

```bash
cd /Users/camiloalegria/Desktop/VIRAPP/verificador-app/app && scp ./vps-implementation-complete.sh root@213.199.39.147:/root/ && ssh root@213.199.39.147 "cd /root && chmod +x vps-implementation-complete.sh && ./vps-implementation-complete.sh"
```

**Contraseña**: `Aintelligence2025` (te la pedirá 2 veces)

---

## 📊 COMANDOS DE MONITOREO (OPCIONAL)

Mientras se ejecuta el script, abre **otra terminal** y monitorea:

```bash
# Ver logs en tiempo real
ssh root@213.199.39.147 "tail -f /root/organization.log"

# Verificar que el servicio sigue corriendo
ssh root@213.199.39.147 "systemctl status radio-recorder"
```

---

## ⚠️ SI ALGO SALE MAL

Si necesitas restaurar el backup automático:

```bash
# Conéctate al VPS
ssh root@213.199.39.147

# Restaurar backup (reemplaza la fecha con la del backup creado)
cd /root
tar -xzf backups/radio-recordings-20251201-*.tar.gz
systemctl restart radio-recorder
```

---

**¡Listo para ejecutar!** Comienza con el **PASO 1**.