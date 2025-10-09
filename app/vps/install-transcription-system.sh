#!/bin/bash

# Script de instalación del sistema de transcripciones automáticas
echo "🎙️ INSTALANDO SISTEMA DE TRANSCRIPCIONES AUTOMÁTICAS"
echo "=" * 60

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para instalar paquetes
install_package() {
    if command_exists apt-get; then
        sudo apt-get update && sudo apt-get install -y "$1"
    elif command_exists yum; then
        sudo yum install -y "$1"
    elif command_exists dnf; then
        sudo dnf install -y "$1"
    else
        echo "❌ No se pudo determinar el gestor de paquetes"
        exit 1
    fi
}

echo "1️⃣ Verificando dependencias del sistema..."

# Verificar Python
if ! command_exists python3; then
    echo "📦 Instalando Python 3..."
    install_package python3
    install_package python3-pip
else
    echo "✅ Python 3 ya está instalado"
fi

# Verificar pip
if ! command_exists pip3; then
    echo "📦 Instalando pip..."
    install_package python3-pip
else
    echo "✅ pip ya está instalado"
fi

# Verificar ffmpeg
if ! command_exists ffmpeg; then
    echo "📦 Instalando ffmpeg..."
    install_package ffmpeg
else
    echo "✅ ffmpeg ya está instalado"
fi

echo ""
echo "2️⃣ Instalando OpenAI Whisper..."

# Instalar Whisper
pip3 install --upgrade pip
pip3 install openai-whisper

# Verificar instalación de Whisper
if command_exists whisper; then
    echo "✅ Whisper instalado correctamente"
    whisper --help | head -5
else
    echo "❌ Error instalando Whisper"
    exit 1
fi

echo ""
echo "3️⃣ Descargando modelos de Whisper..."

# Crear directorio para modelos si no existe
mkdir -p ~/.cache/whisper

# Descargar modelo base (recomendado para español)
echo "📥 Descargando modelo 'base' (recomendado para español)..."
python3 -c "import whisper; whisper.load_model('base')"

echo "📥 Descargando modelo 'small' (mejor calidad)..."
python3 -c "import whisper; whisper.load_model('small')"

echo ""
echo "4️⃣ Configurando permisos y directorios..."

# Crear directorios necesarios
mkdir -p ./recordings
mkdir -p ./config
mkdir -p ./logs

# Establecer permisos
chmod 755 ./recordings
chmod 755 ./config
chmod 755 ./logs

echo ""
echo "5️⃣ Probando sistema de transcripción..."

# Crear archivo de audio de prueba (silencio de 5 segundos)
echo "🎵 Creando archivo de prueba..."
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 5 -q:a 9 -acodec mp3 test_audio.mp3 -y 2>/dev/null

if [ -f "test_audio.mp3" ]; then
    echo "🧪 Probando transcripción..."
    
    # Probar Whisper con el archivo de prueba
    whisper test_audio.mp3 --model base --language Spanish --output_format txt --output_dir . --verbose False
    
    if [ -f "test_audio.txt" ]; then
        echo "✅ Sistema de transcripción funcionando correctamente"
        echo "📄 Contenido de prueba:"
        cat test_audio.txt
        
        # Limpiar archivos de prueba
        rm -f test_audio.mp3 test_audio.txt
    else
        echo "❌ Error en la transcripción de prueba"
    fi
else
    echo "❌ Error creando archivo de prueba"
fi

echo ""
echo "6️⃣ Instalando dependencias de Node.js..."

# Verificar si package.json existe y actualizar dependencias
if [ -f "package.json" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
else
    echo "📦 Creando package.json con dependencias..."
    cat > package.json << 'EOF'
{
  "name": "vps-radio-recording-enhanced",
  "version": "2.0.0",
  "description": "Sistema de grabación de radios con transcripciones automáticas",
  "main": "enhanced-server.js",
  "scripts": {
    "start": "node enhanced-server.js",
    "dev": "node enhanced-server.js",
    "test": "node test-transcription.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-cron": "^3.0.3"
  },
  "keywords": ["radio", "recording", "transcription", "whisper", "automation"],
  "author": "VPS Radio System",
  "license": "MIT"
}
EOF
    npm install
fi

echo ""
echo "7️⃣ Creando script de prueba de transcripciones..."

cat > test-transcription.js << 'EOF'
// Script de prueba para el sistema de transcripciones
const TranscriptionManager = require('./transcription-manager');

async function testTranscriptionSystem() {
    console.log('🧪 PROBANDO SISTEMA DE TRANSCRIPCIONES');
    console.log('=' * 50);
    
    const manager = new TranscriptionManager('./recordings');
    
    // Obtener estadísticas
    const stats = manager.getTranscriptionStats();
    console.log('📊 Estadísticas actuales:');
    console.log(`   📁 Carpetas: ${stats.totalFolders}`);
    console.log(`   🎵 Grabaciones: ${stats.totalRecordings}`);
    console.log(`   ✅ Transcritas: ${stats.transcribed}`);
    console.log(`   ⏳ Pendientes: ${stats.pending}`);
    console.log(`   📈 Tasa: ${stats.transcriptionRate}%`);
    
    if (stats.pending > 0) {
        console.log('\n🚀 Iniciando transcripción de archivos pendientes...');
        await manager.forceTranscription();
    } else {
        console.log('\n✅ No hay transcripciones pendientes');
    }
    
    console.log('\n🎯 Sistema de transcripciones listo');
}

testTranscriptionSystem().catch(console.error);
EOF

echo ""
echo "8️⃣ Configurando servicio systemd..."

# Crear archivo de servicio systemd
sudo tee /etc/systemd/system/radio-recording-enhanced.service > /dev/null << EOF
[Unit]
Description=Radio Recording Enhanced with Transcriptions
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node enhanced-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable radio-recording-enhanced

echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "=" * 60
echo ""
echo "🎯 RESUMEN DEL SISTEMA INSTALADO:"
echo "   📦 Whisper: Instalado con modelos 'base' y 'small'"
echo "   🎙️ Transcripciones automáticas: 02:00-05:00 AM"
echo "   📁 Grabaciones organizadas en carpetas separadas"
echo "   🤖 Scheduler mejorado con metadata completa"
echo "   🔧 Servicio systemd configurado"
echo ""
echo "🚀 COMANDOS PARA USAR:"
echo "   Iniciar servidor: npm start"
echo "   Probar transcripciones: node test-transcription.js"
echo "   Iniciar servicio: sudo systemctl start radio-recording-enhanced"
echo "   Ver logs: sudo journalctl -u radio-recording-enhanced -f"
echo "   Estado del servicio: sudo systemctl status radio-recording-enhanced"
echo ""
echo "📋 ENDPOINTS DISPONIBLES:"
echo "   http://localhost:3000/ - Estado general"
echo "   http://localhost:3000/api/scheduler/status - Estado del scheduler"
echo "   http://localhost:3000/api/transcriptions/stats - Estadísticas de transcripciones"
echo "   http://localhost:3000/api/transcriptions/force - Forzar transcripción"
echo ""
echo "🌙 Las transcripciones se ejecutarán automáticamente entre las 2:00-5:00 AM"
echo "📁 Las grabaciones se guardarán en carpetas separadas con metadata completa"
echo ""
echo "💡 Para probar el sistema completo:"
echo "   1. Inicia el servidor: npm start"
echo "   2. Envía una programación desde el dashboard"
echo "   3. Verifica que se cree la grabación en su carpeta"
echo "   4. Espera a las 2-5 AM o fuerza transcripción con: curl -X POST http://localhost:3000/api/transcriptions/force"
