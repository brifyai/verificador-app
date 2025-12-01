# 🚀 Guía de Uso - Aplicación en Puerto 3000

## 📋 Resumen de Estado

✅ **LA APLICACIÓN ESTÁ FUNCIONANDO CORRECTAMENTE EN PUERTO 3000**

### ✅ Características Implementadas:

1. **Login Directo Funcional** - Autenticación mediante tabla `users` de Supabase
2. **Middleware Simplificado** - Sin conflictos de autenticación dual
3. **API Endpoints Activos** - Todos los endpoints directos funcionando
4. **Autenticación Unificada** - Solo usa la tabla `users` de Supabase

---

## 🔑 Credenciales de Acceso

### Usuario Administrador Existente:
- **Email:** `admin@verificador.com`
- **Password:** `admin`
- **Rol:** ADMIN
- **Estado:** Activo

### Segundo Usuario Administrador:
- **Email:** `admin@ondaverificada.com`
- **Password:** `admin`
- **Rol:** ADMIN
- **Estado:** Activo

---

## 🧪 Scripts de Prueba Disponibles

### 1. Verificar Usuarios Existentes
```bash
cd app && node scripts/check-users-direct.js
```

### 2. Probar Login Directo
```bash
cd app && node scripts/test-login-direct.js
```

### 3. Verificar Aplicación Completa
```bash
cd app && node scripts/test-app-3000.js
```

---

## 🔗 Endpoints de API Activos

### ✅ Rutas Públicas (Sin Autenticación Requerida):

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login-direct` | POST | Login con email/password |
| `/api/auth/providers` | GET | Proveedores de autenticación |
| `/api/dashboard/stats-direct` | GET | Estadísticas del dashboard |
| `/api/radios-direct` | GET/POST | Gestión de radios |
| `/api/audios/list` | GET | Listado de audios |
| `/api/audios/stats` | GET | Estadísticas de audios |
| `/api/detecciones-direct` | GET/POST | Gestión de detecciones |
| `/api/monitoring/*-direct` | GET/POST | Endpoints de monitoreo |
| `/api/billing/*-direct` | GET/POST | Gestión de facturación |

---

## 🚀 Cómo Usar la Aplicación

### 1. Iniciar el Servidor
```bash
cd app
npm run dev
```

### 2. Acceder al Login Directo
**URL:** `http://localhost:3000/api/auth/login-direct`

**Método:** POST
**Body:**
```json
{
  "email": "admin@verificador.com",
  "password": "admin"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": "admin-1",
    "email": "admin@verificador.com",
    "name": "Administrador",
    "role": "ADMIN"
  }
}
```

### 3. Verificar Conexión con Supabase
```bash
cd app && node scripts/test-supabase-direct.js
```

---

## 📊 Dashboard y Estadísticas

### Endpoint de Estadísticas:
**URL:** `http://localhost:3000/api/dashboard/stats-direct`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDetections": 150,
      "todayDetections": 12,
      "weekDetections": 89,
      "monthDetections": 150,
      "totalRadios": 25,
      "totalPhrases": 50
    },
    "activity": {
      "recentDetections": [...]
    },
    "verification": {
      "verifiedDetections": 120,
      "verificationRate": 80
    }
  }
}
```

---

## 🔧 Solución de Problemas

### Si el login falla:
1. Verificar que el usuario existe: `node scripts/check-users-direct.js`
2. Verificar contraseña: `admin`
3. Verificar que Supabase esté conectado: `node scripts/test-supabase-direct.js`

### Si el servidor no responde:
1. Verificar que esté ejecutándose: `npm run dev`
2. Verificar puerto 3000 esté disponible
3. Verificar logs de compilación

### Si hay errores de autenticación:
1. El middleware ya está configurado para permitir rutas públicas
2. El login directo usa SOLO la tabla `users` de Supabase
3. No hay conflictos con NextAuth.js

---

## 🎯 Próximos Pasos

### Para Producción:
1. **Quitar modo prueba** del endpoint de login
2. **Implementar JWT tokens** para sesiones
3. **Agregar validación de roles** en el middleware
4. **Configurar HTTPS** para comunicación segura

### Mejoras Opcionales:
1. **Agregar refresh tokens**
2. **Implementar rate limiting**
3. **Agregar logs detallados**
4. **Configurar CORS apropiadamente**

---

## 📞 Soporte

Si encuentras problemas:

1. **Verifica los logs** del terminal donde ejecutas `npm run dev`
2. **Ejecuta los scripts de prueba** para diagnosticar
3. **Revisa la conexión con Supabase** usando `test-supabase-direct.js`
4. **Verifica que el middleware** no esté bloqueando rutas necesarias

---

## ✅ Verificación Final

Ejecuta este comando para verificar todo:
```bash
cd app && node scripts/test-app-3000.js
```

**Resultado Esperado:**
```
🚀 Probando aplicación en puerto 3000...
✅ Servidor está respondiendo (status: 200)
✅ Login directo funcionando correctamente
✅ Rutas públicas accesibles
✅ API endpoints disponibles
🎉 Pruebas completadas
```

---

**🎉 ¡LA APLICACIÓN ESTÁ LISTA PARA USAR EN PUERTO 3000! 🎉**