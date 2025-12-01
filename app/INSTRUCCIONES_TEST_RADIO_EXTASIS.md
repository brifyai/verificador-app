# 🎵 Instrucciones de Prueba - Fix Radio Extasis (SONICPANEL)

## 📋 Resumen del Problema

El radio **"Extasis"** con URL `https://sonic.streamingchilenos.com/8142/stream` no podía ser actualizado debido a un error de constraint en la base de datos:

```
violates check constraint "radios_platform_check"
```

### Causa Raíz
El constraint `radios_platform_check` solo permite 3 valores: `'OTHER'`, `'YOUTUBE'`, `'TWITCH'`, pero el sistema intentaba guardar `'SONICPANEL'` directamente.

## ✅ Solución Implementada

Se modificó la función [`mapPlatformToDbSmart()`](app/lib/platform-mapping-smart.ts:230) para:

1. **Respetar el constraint de la base de datos** - Solo YOUTUBE y TWITCH se guardan con su valor original
2. **Mapear todas las demás plataformas a OTHER** - SONICPANEL, CENTOVA, AZURACAST, etc. → OTHER
3. **Preservar la información original** - Se guarda en `metadata.original_platform`

## 🧪 Scripts de Prueba Disponibles

### 1. Test de Mapeo de Plataformas
```bash
cd app && node test-sonicpanel-fix.js
```

**Resultado esperado**: Todas las pruebas pasan (9/9)

### 2. Test de Simulación de Actualización
```bash
cd app && node test-radio-extasis-update.js
```

**Resultado esperado**: Simulación exitosa del radio Extasis

## 🔧 Prueba Manual en la Aplicación

### Paso 1: Verificar que el servidor esté corriendo
```bash
cd app && npm run dev
```

### Paso 2: Acceder al panel de administración
- URL: `http://localhost:3000`
- Login: `admin@verificador.com`
- Contraseña: `admin123`

### Paso 3: Buscar el radio "Extasis"
1. Ir a la sección **"Radios"**
2. Buscar **"Extasis"** en la lista
3. Hacer clic en **"Editar"**

### Paso 4: Actualizar el radio
1. Verificar que la URL sea: `https://sonic.streamingchilenos.com/8142/stream`
2. Verificar que la plataforma sea: **"sonicpanel"**
3. Hacer clic en **"Guardar cambios"**

### Paso 5: Verificar el resultado
✅ **ÉXITO**: El radio se actualiza sin errores
❌ **ERROR**: Si aparece un mensaje de error, revisar los logs del servidor

## 📊 Verificación del Fix

### En los logs del servidor, deberías ver:
```
[RADIOS-UPDATE] Plataforma mapeada: sonicpanel → OTHER
[RADIOS-UPDATE] Radio actualizado exitosamente: Extasis
```

### En la base de datos, el registro tendrá:
```json
{
  "platform": "OTHER",
  "metadata": {
    "original_platform": "sonicpanel",
    "stream_url": "https://sonic.streamingchilenos.com/8142/stream"
  }
}
```

## 🔍 Troubleshooting

### Si el error persiste:
1. **Verificar que el archivo esté actualizado**:
   ```bash
   grep -n "YOUTUBE.*TWITCH" app/lib/platform-mapping-smart.ts
   ```
   Debe mostrar la lógica del constraint.

2. **Reiniciar el servidor**:
   ```bash
   cd app && pkill -f "npm run dev" && npm run dev
   ```

3. **Verificar logs en tiempo real**:
   ```bash
   cd app && tail -f nohup.out
   ```

### Si aparece otro error:
- **Campo 'city'**: Verificar que no esté vacío
- **Otros constraints**: Revisar que todos los campos requeridos tengan valores válidos

## 🎯 Resultado Esperado

Después de aplicar este fix:
1. ✅ El radio "Extasis" puede ser editado sin errores
2. ✅ La URL `https://sonic.streamingchilenos.com/8142/stream` se acepta
3. ✅ La plataforma "sonicpanel" se guarda correctamente en metadata
4. ✅ El constraint de la base de datos se respeta

## 📝 Notas Adicionales

- Este fix aplica a **TODAS** las plataformas, no solo SONICPANEL
- Las plataformas YOUTUBE y TWITCH siguen guardándose normalmente
- La información original nunca se pierde (se guarda en metadata)
- El fix es retroactivo - funciona con radios existentes y nuevos

---

**✨ ¡Listo! El radio Extasis ya debería funcionar correctamente.**