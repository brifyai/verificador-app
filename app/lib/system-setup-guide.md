
# 🛠️ Guía de Instalación del Sistema de Monitoreo

Esta guía te ayudará a configurar las dependencias necesarias para que el sistema de monitoreo funcione completamente.

## 📋 Dependencias Requeridas

### 1. 🎵 FFmpeg (OBLIGATORIO)
Herramienta para capturar y procesar audio de streams de radio.

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# macOS
brew install ffmpeg

# Verificar instalación
ffmpeg -version
```

### 2. 🤖 Whisper (OBLIGATORIO - para transcripción)
OpenAI Whisper para convertir audio a texto.

```bash
# Instalar Python 3.8+ si no está instalado
sudo apt install python3 python3-pip

# Instalar Whisper
pip3 install openai-whisper

# Verificar instalación
python3 -c "import whisper; print('Whisper OK')"

# Descargar modelo base (recomendado para español)
python3 -c "import whisper; whisper.load_model('base')"
```

### 3. 📺 yt-dlp (OPCIONAL - solo para YouTube/plataformas especiales)
Para descargar streams de YouTube Live y plataformas similares.

```bash
# Método recomendado
pip3 install yt-dlp

# O desde GitHub (más actualizado)
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
sudo mv yt-dlp /usr/local/bin/
sudo chmod +x /usr/local/bin/yt-dlp

# Verificar
yt-dlp --version
```

### 4. 📡 Streamlink (OPCIONAL - solo para Twitch)
Para streams de Twitch y otras plataformas.

```bash
# Ubuntu/Debian
sudo apt install streamlink

# O con pip
pip3 install streamlink

# Verificar
streamlink --version
```

## 🚀 Verificación del Sistema

Una vez instaladas las dependencias, el dashboard mostrará:

```
✅ ffmpeg      [OK]
✅ whisper     [OK] 
✅ yt-dlp      [OK]
✅ streamlink  [OK]
```

## 📁 Estructura de Directorios

El sistema creará automáticamente:

```
tu-proyecto/
├── captures/              # Audio capturado temporalmente
├── monitoring-data/       # Datos de sesiones persistentes
│   ├── sessions/
│   └── events.json
└── logs/                  # Logs del sistema
```

## ⚙️ Variables de Entorno

Asegúrate de tener configurado:

```env
ABACUSAI_API_KEY=tu_api_key_aqui
```

## 🔧 Comandos de Prueba

### Probar FFmpeg con stream directo:
```bash
ffmpeg -i "http://stream.radioparadise.com/aac-320" -t 10 -acodec pcm_s16le -ar 16000 -ac 1 test.wav
```

### Probar Whisper:
```bash
python3 -c "
import whisper
model = whisper.load_model('base')
result = model.transcribe('test.wav', language='es')
print(result['text'])
"
```

## 🎯 Uso Recomendado por Tipo de Radio

### 🟢 FÁCIL (90% de radios chilenas)
**Icecast/Shoutcast/Streams directos**
- Solo necesitas: `ffmpeg`
- Plataformas: Radio Agricultura, Cooperativa, Biobío, etc.

### 🟡 INTERMEDIO
**YouTube Live**  
- Necesitas: `ffmpeg` + `yt-dlp`
- Para radios que transmiten por YouTube

**Twitch**
- Necesitas: `ffmpeg` + `streamlink`
- Para radios que usan Twitch

### 🔴 COMPLEJO
**Facebook Live, Instagram Live**
- Requiere configuración especial
- Usa APIs específicas de cada plataforma

## 🚨 Resolución de Problemas

### Error: "ffmpeg: command not found"
```bash
# Verificar PATH
echo $PATH
which ffmpeg

# Reinstalar si es necesario
sudo apt install --reinstall ffmpeg
```

### Error: "No module named 'whisper'"
```bash
# Verificar Python
python3 --version
pip3 list | grep whisper

# Reinstalar
pip3 install --upgrade openai-whisper
```

### Audio capturado sin sonido
```bash
# Probar con diferentes códecs
ffmpeg -i "URL_STREAM" -t 5 -c copy test_raw.wav
ffmpeg -i "URL_STREAM" -t 5 -acodec libmp3lame test_mp3.wav
```

## 📊 Monitoreo de Recursos

### CPU y Memoria
- FFmpeg: ~5-10% CPU por stream
- Whisper: ~20-30% CPU durante transcripción
- Memoria: ~100-200MB por sesión activa

### Almacenamiento
- Audio temporal: ~1MB por minuto grabado  
- Audio publicitario guardado: ~500KB por detección
- Limpieza automática cada 24h

## 🔒 Permisos

```bash
# Dar permisos al usuario para ejecutar herramientas
sudo usermod -a -G audio $USER
sudo chmod +x /usr/local/bin/yt-dlp
sudo chmod 755 /path/to/captures/
```

## 🎉 ¡Todo Listo!

Una vez completada la instalación:

1. Reinicia el servidor Next.js
2. Ve al dashboard → "Radios"  
3. Selecciona una radio
4. ¡Haz clic en "Iniciar Monitoreo"!

El sistema comenzará a capturar audio cada 5 minutos y detectará automáticamente publicidad usando IA.
