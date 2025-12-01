# Análisis de Radios Offline - 103 Radios

## Resumen Ejecutivo
Después de analizar los logs de la verificación masiva, identifiqué **6 categorías principales** por las que las 103 radios aparecen como offline.

## Categorías de Problemas

### 1. 🔴 **SERVIDORES DIGITAL PRO SERVER - HTTP 400** (Mayoría)
**Problema**: Servidores Icecast que responden con HTTP 400 (Bad Request)
**Ejemplos detectados**:
- `https://archi-us.digitalproserver.com/quillota-fm.aac` - Status 400
- `https://sonando-us.digitalproserver.com/radiotalcahuano.aac` - Status 400
- `https://archi-us.digitalproserver.com/superandina.aac` - Status 400
- `https://archi-us.digitalproserver.com/magica.aac` - Status 400

**Causa**: Icecast responde con HTTP 400 a peticiones HEAD, pero el stream está activo
**Solución**: Aceptar HTTP 400 como ONLINE para servidores Icecast (ya implementado parcialmente)

### 2. 🔴 **CONEXIONES RECHAZADAS** (Segundo problema más común)
**Problema**: Conexión directamente rechazada por el servidor
**Ejemplos**:
- `https://streaming.comunicacioneschile.net/8016/stream` - connect ECONNREFUSED
- `https://shaincast.caster.fm:38459/listen.mp3` - connect ECONNREFUSED
- `https://cdn1.onstream.audio:6555/polar` - connect ECONNREFUSED

**Causa**: Servidores apagados, puertos cerrados o servicios detenidos
**Estado**: Realmente offline - no hay solución inmediata

### 3. 🔴 **TIMEOUTS Y ABORTOS**
**Problema**: Conexión que se aborta o timeout
**Ejemplos**:
- `https://cast.tunzilla.com/http://radio.mediadev.cl:8110/san_fernando` - This operation was aborted
- `http://192.99.18.164:9996/` - socket hang up
- `http://stream5.eltelon.com/genoveva.aac` - HTTPS verification timeout

**Causa**: Servidores lentos, problemas de red o URLs malformadas
**Solución**: Aumentar timeouts o mejorar manejo de URLs

### 4. 🔴 **DNS Y DOMINIOS NO ENCONTRADOS**
**Problema**: Dominios que no existen o no resuelven
**Ejemplos**:
- `http://s01.midns.net/victoria` - getaddrinfo ENOTFOUND s01.midns.net
- `https://test-stream.com/radio.mp3` - getaddrinfo ENOTFOUND test-stream.com

**Causa**: Dominios expirados o URLs de prueba
**Estado**: Realmente offline - requieren actualización manual

### 5. 🔴 **ERRORES 404 Y 401**
**Problema**: Recurso no encontrado o no autorizado
**Ejemplos**:
- `https://streaming.chiloestreaming.com:10989/` - Status 404
- `https://stream.zeno.fm/sxmb6p9atc9uv` - Status 404
- `https://streaming-secure.conectaapp.cl/fmquiero.cl` - Status 403

**Causa**: Streams movidos, URLs incorrectas o requieren autenticación
**Estado**: Requieren corrección manual de URLs

### 6. 🔴 **FETCH FAILED VARIOS**
**Problema**: Errores genéricos de fetch
**Ejemplos**:
- `http://01.solumedia.com.ar:8378/` - fetch failed
- `https://centova.neonetwork.cl:9154/stream` - fetch failed

**Causa**: Múltiples problemas de red o servidor
**Solución**: Ya implementado fallback HTTPS (algunos se resolvieron con fallback)

## Radios que DEBERÍAN estar ONLINE

### ✅ Casos resueltos con fallback HTTPS:
- `https://centova.neonetwork.cl:9154/stream` - HTTPS verification: Status 200
- `https://ibanez.servercl.com:8000/ibanez` - HTTPS verification: Status 200
- `https://streaming1.tecnoera.com:8227/` - HTTPS verification: Status 302 (redirect)

### ✅ Streams Digital FM que funcionan con HTTPS:
- `https://radio.digitalfm.cl:8000/sanantonio2` - Status 200
- `https://radio.digitalfm.cl:8000/copiapo2` - Status 200
- `https://radio.digitalfm.cl:8000/temuco2` - Status 200
- `https://radio.digitalfm.cl:8000/losangeles2` - Status 200
- `https://radio.digitalfm.cl:8000/valdivia2` - Status 200
- `https://radio.digitalfm.cl:8000/losvilos2` - Status 200

## Recomendaciones de Acción

### 1. **Prioridad ALTA** - Digital Pro Server
Implementar aceptación de HTTP 400 como ONLINE para todos los servidores `.digitalproserver.com`

### 2. **Prioridad MEDIA** - Timeouts y abortos
Aumentar timeouts de verificación de 5s a 10s para servidores lentos

### 3. **Prioridad BAJA** - URLs malformadas
Limpiar URLs con prefijos incorrectos como `https://cast.tunzilla.com/http://`

### 4. **Mantenimiento** - URLs inválidas
Actualizar manualmente URLs con dominios expirados o servidores apagados

## Estadísticas Finales
- **Total verificadas**: 270 radios
- **Online**: 167 radios (62%)
- **Offline**: 103 radios (38%)
- **Potencialmente recuperables**: ~30-40 radios con mejoras en el sistema

## Próximos Pasos
1. Implementar aceptación HTTP 400 para Digital Pro Server
2. Aumentar timeouts para servidores lentos
3. Limpiar URLs malformadas
4. Re-verificar después de implementar mejoras