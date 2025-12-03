# 📁 Guía de Organización del VPS - Sistema de Grabaciones

## 🎯 Objetivo
Este documento describe la estructura de carpetas organizada para las grabaciones de radio en el VPS, siguiendo el formato solicitado: **Día → Radio → Grabaciones**.

---

## 📂 Estructura de Carpetas

### Organización Jerárquica

```
/home/radioapp/radio-recorder/recordings/
├── 2025-12-01/
│   └── mijm9xsi_6nx1sqf/
│       ├── radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282.mp3
│       └── radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282.mp3
├── 2025-11-30/
│   ├── radio_mijm9xrp_g964ijg/
│   │   └── radio_mijm9xrp_g964ijg_20251130_195307_92aa2179.mp3
│   └── radio-1/
│       └── radio-1_20251130_061050_5c8ca413.mp3
└── 2025-11-29/
    └── radio_mijm9xdj_gb68gow/
        └── radio_mijm9xdj_gb68gow_20251129_061937_da5e76d3.mp3
```

### Descripción de Niveles

1. **Nivel 1: Carpeta por Día** (`YYYY-MM-DD/`)
   - Cada día tiene su propia carpeta
   - Nombre formato: `2025-12-01`, `2025-11-30`, etc.
   - Facilita la búsqueda por fecha

2. **Nivel 2: Carpeta por Radio** (`{radio_id}/`)
   - Dentro de cada día, carpetas por cada radio
   - Nombre formato: `mijm9xsi_6nx1sqf`, `radio-1`, etc.
   - Contiene todas las grabaciones de esa radio en ese día

3. **Nivel 3: Archivos de Grabación** (`.mp3`)
   - Archivos individuales de audio
   - Nombre formato: `radio_{id}_{timestamp}_{uuid}.mp3`
   - Incluye metadata en el nombre para identificación

---

## 🚀 Script de Organización

### Archivo Generado
- **Nombre**: `vps-organization-by-date-radio.sh`
- **Ubicación**: `app/vps-organization-by-date-radio.sh`
- **Función**: Organiza automáticamente todas las grabaciones existentes

### Cómo Ejecutar el Script

#### Paso 1: Copiar al VPS
```bash
cd app
scp ./vps-organization-by-date-radio.sh radioapp@213.199.39.147:/home/radioapp/
```

#### Paso 2: Conectar al VPS
```bash
ssh radioapp@213.199.39.147
```

#### Paso 3: Ejecutar el Script
```bash
cd /home/radioapp
bash vps-organization-by-date-radio.sh
```

#### Paso 4: Verificar Resultados
```bash
ls -la /home/radioapp/radio-recorder/recordings/
```

---

## 📊 Reporte de Organización

El script genera un reporte detallado en:
- **Ubicación**: `/home/radioapp/radio-recorder/ORGANIZATION_REPORT.txt`
- **Contenido**: Estadísticas y detalle de archivos organizados

### Ejemplo de Reporte
```
===========================================
REPORTE DE ORGANIZACIÓN DE GRABACIONES
Fecha: Mon Dec 01 2025 20:23:00 GMT+0000
Estructura: DIA/RADIO/GRABACIONES
===========================================

TOTAL ESTADÍSTICAS:
- Archivos organizados: 2
- Días procesados: 1
- Radios diferentes: 1

DETALLE POR DÍA:

2025-12-01:
  - mijm9xsi_6nx1sqf: 2 grabaciones
```

---

## 🔍 Cómo Funciona el Sistema

### Extracción de Información

El script analiza cada nombre de archivo para extraer:

1. **ID de Radio**: Extraído del patrón `radio_{id}_{timestamp}`
   - Ejemplo: `radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282.mp3`
   - Radio ID: `mijm9xsi_6nx1sqf`

2. **Fecha**: Extraída del timestamp en el nombre
   - Ejemplo: `20251201` → `2025-12-01`

3. **Timestamp Completo**: Para ordenamiento cronológico
   - Formato: `YYYYMMDDHHMMSS`

### Proceso de Organización

1. **Escaneo**: Identifica todos los archivos `.mp3` en el directorio de grabaciones
2. **Análisis**: Extrae radio ID y fecha de cada archivo
3. **Creación de Estructura**: Crea carpetas por día y por radio
4. **Movimiento**: Mueve cada archivo a su carpeta correspondiente
5. **Limpieza**: Elimina directorios vacíos
6. **Permisos**: Establece `radioapp:radioapp` con permisos `755`
7. **Reporte**: Genera archivo de reporte con estadísticas

---

## 📋 Ventajas de esta Estructura

### ✅ Beneficios

1. **Navegación Intuitiva**: Fácil de encontrar grabaciones por fecha
2. **Organización Lógica**: Todas las grabaciones de una radio en un día están juntas
3. **Escalable**: Funciona con miles de grabaciones y cientos de radios
4. **Mantenible**: Simple de entender y mantener
5. **Compatible**: Funciona con el sistema existente de grabación

### 📈 Estadísticas Actuales

- **Total de Radios**: 270
- **Total de Grabaciones**: 2 archivos (hoy)
- **Días con Grabaciones**: 1 día (2025-12-01)
- **Radios Activas**: 1 radio (mijm9xsi_6nx1sqf - Astronomica)

---

## 🔄 Actualizaciones Futuras

### Para Nuevas Grabaciones

El sistema automáticamente:
1. Detecta nuevos archivos `.mp3` en el directorio principal
2. Crea las carpetas necesarias (día/radio) si no existen
3. Mueve los archivos a su ubicación correcta
4. Actualiza el reporte de organización

### Script de Actualización Automática

Para mantener la organización diariamente, puedes configurar un cron job:

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar cada día a las 2 AM
0 2 * * * /home/radioapp/vps-organization-by-date-radio.sh >> /home/radioapp/organization.log 2>&1
```

---

## 🛡️ Seguridad y Permisos

### Permisos Establecidos
- **Usuario**: `radioapp`
- **Grupo**: `radioapp`
- **Permisos**: `755` (rwxr-xr-x)

### Acceso
- Solo el usuario `radioapp` puede modificar archivos
- Otros usuarios pueden leer (descargar) grabaciones
- El sistema de grabación mantiene acceso completo

---

## 📞 Soporte

### Si Necesitas Ayuda

1. **Verificar conexión al VPS**:
   ```bash
   ssh radioapp@213.199.39.147
   ```

2. **Verificar estructura actual**:
   ```bash
   ls -la /home/radioapp/radio-recorder/recordings/
   ```

3. **Verificar reporte**:
   ```bash
   cat /home/radioapp/radio-recorder/ORGANIZATION_REPORT.txt
   ```

4. **Re-ejecutar organización**:
   ```bash
   cd /home/radioapp
   bash vps-organization-by-date-radio.sh
   ```

---

## ✅ Resumen

La estructura de carpetas del VPS ahora está organizada de forma lógica y eficiente:

- **Por Día**: Fácil de encontrar grabaciones por fecha
- **Por Radio**: Todas las grabaciones de una radio en un día juntas
- **Automatizado**: Script generado para organizar y mantener la estructura
- **Documentado**: Reporte automático con estadísticas

**Estado**: ✅ Completado y listo para uso