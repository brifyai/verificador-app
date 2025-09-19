
#!/bin/bash

echo "🎵 Instalando dependencias para captura de audio..."

# Actualizar sistema
echo "📦 Actualizando paquetes del sistema..."
sudo apt-get update -y

# Instalar FFmpeg
echo "🔧 Instalando FFmpeg..."
sudo apt-get install -y ffmpeg

# Instalar Python3 y pip si no están instalados
echo "🐍 Verificando Python3 y pip..."
sudo apt-get install -y python3 python3-pip

# Instalar yt-dlp
echo "📺 Instalando yt-dlp para YouTube..."
python3 -m pip install --upgrade yt-dlp

# Instalar streamlink para Twitch
echo "🎮 Instalando streamlink para Twitch..."
python3 -m pip install --upgrade streamlink

# Verificar instalaciones
echo ""
echo "✅ Verificando instalaciones:"
echo ""

# Verificar FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg instalado: $(ffmpeg -version | head -1)"
else
    echo "❌ FFmpeg NO instalado"
fi

# Verificar yt-dlp
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp instalado: $(yt-dlp --version)"
else
    echo "❌ yt-dlp NO instalado"
fi

# Verificar streamlink
if command -v streamlink &> /dev/null; then
    echo "✅ streamlink instalado: $(streamlink --version | head -1)"
else
    echo "❌ streamlink NO instalado"
fi

echo ""
echo "🎯 Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Reinicia el servidor de desarrollo"
echo "2. Ve a la sección 'Radios' para comenzar el monitoreo"
echo "3. Revisa el estado del sistema en la página 'Monitoreo'"
echo ""
