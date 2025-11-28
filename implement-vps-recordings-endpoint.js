#!/usr/bin/env node

/**
 * Script para implementar el endpoint /api/recordings en el VPS Flask
 * Este script:
 * 1. Se conecta al VPS vía SSH
 * 2. Busca el archivo del servidor Flask
 * 3. Agrega el endpoint /api/recordings
 * 4. Reinicia el servicio
 * 5. Verifica que funciona
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const VPS_HOST = '213.199.39.147';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Aintelligence2025';
const RECORDINGS_DIR = '/home/radioapp/radio-recorder/recordings';
const FLASK_APP_DIR = '/home/radioapp/radio-recorder';

// Código Python para el endpoint
const ENDPOINT_CODE = `
# Endpoint para listar grabaciones
@app.route('/api/recordings', methods=['GET'])
def list_recordings():
    """
    Lista todas las grabaciones MP3 disponibles en el directorio de recordings
    """
    try:
        import os
        from datetime import datetime
        
        recordings = []
        
        # Recorrer recursivamente el directorio de grabaciones
        for root, dirs, files in os.walk('${RECORDINGS_DIR}'):
            for file in files:
                if file.endswith('.mp3'):
                    file_path = os.path.join(root, file)
                    stat = os.stat(file_path)
                    
                    # Extraer metadata del archivo
                    recording = {
                        'filename': file,
                        'size': stat.st_size,
                        'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat() + 'Z',
                        'path': file_path,
                        'created': datetime.fromtimestamp(stat.st_mtime).isoformat() + 'Z'
                    }
                    recordings.append(recording)
        
        # Ordenar por fecha (más recientes primero)
        recordings.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'count': len(recordings),
            'recordings': recordings
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'count': 0,
            'recordings': []
        }), 500
`;

// Función para ejecutar comandos SSH
function sshCommand(command, callback) {
  const sshCommand = `sshpass -p '${VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${command}"`;
  console.log(`🔍 Ejecutando: ${command}`);
  exec(sshCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      callback(error, null);
      return;
    }
    if (stderr) {
      console.error(`⚠️  STDERR: ${stderr}`);
    }
    callback(null, stdout);
  });
}

// Función para copiar archivo al VPS
function scpFile(localPath, remotePath, callback) {
  const scpCommand = `sshpass -p '${VPS_PASSWORD}' scp -o StrictHostKeyChecking=no ${localPath} ${VPS_USER}@${VPS_HOST}:${remotePath}`;
  console.log(`📤 Copiando archivo a VPS: ${localPath} -> ${remotePath}`);
  exec(scpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error SCP: ${error.message}`);
      callback(error);
      return;
    }
    if (stderr) {
      console.error(`⚠️  SCP STDERR: ${stderr}`);
    }
    callback(null);
  });
}

// Paso 1: Usar el archivo conocido del servidor Flask
console.log('🔍 Usando archivo conocido del servidor Flask...');
const flaskAppFile = '/home/radioapp/radio-recorder/api_server.py';
console.log(`✅ Archivo del servidor Flask: ${flaskAppFile}`);

  // Paso 2: Descargar el archivo para modificarlo
  const tempFile = path.join(__dirname, 'temp_flask_app.py');
  const scpDownload = `sshpass -p '${VPS_PASSWORD}' scp -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST}:${flaskAppFile} ${tempFile}`;
  
  console.log('📥 Descargando archivo del servidor Flask...');
  exec(scpDownload, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error descargando archivo: ${error.message}`);
      process.exit(1);
    }

    // Paso 3: Leer y modificar el archivo
    console.log('📝 Modificando archivo para agregar endpoint...');
    let content = fs.readFileSync(tempFile, 'utf8');

    // Verificar si el endpoint ya existe
    if (content.includes("@app.route('/api/recordings'")) {
      console.log('⚠️  El endpoint /api/recordings ya existe');
      
      // Verificar si funciona
      testEndpoint();
      return;
    }

    // Encontrar dónde insertar el código (después de las importaciones y antes de if __name__ == '__main__')
    const insertMarker = /if\s+__name__\s*==\s*['"]__main__['"]:/;
    const match = content.match(insertMarker);
    
    if (!match) {
      // Si no hay bloque main, agregar al final
      content += '\n\n' + ENDPOINT_CODE;
    } else {
      // Insertar antes del bloque main
      const insertIndex = match.index;
      content = content.substring(0, insertIndex) + '\n\n' + ENDPOINT_CODE + '\n\n' + content.substring(insertIndex);
    }

    // Guardar archivo modificado
    fs.writeFileSync(tempFile, content);

    // Paso 4: Subir archivo modificado al VPS
    console.log('📤 Subiendo archivo modificado al VPS...');
    scpFile(tempFile, flaskAppFile, (error) => {
      if (error) {
        console.error('❌ Error subiendo archivo modificado');
        process.exit(1);
      }

      // Limpiar archivo temporal
      fs.unlinkSync(tempFile);

      // Paso 5: Reiniciar el servicio
      console.log('🔄 Reiniciando servicio de grabación...');
      sshCommand('systemctl restart radio-recorder', (error, stdout) => {
        if (error) {
          console.error('❌ Error reiniciando servicio');
          process.exit(1);
        }

        console.log('✅ Servicio reiniciado correctamente');
        
        // Esperar un momento y verificar
        setTimeout(() => {
          testEndpoint();
        }, 3000);
      });
    });
  });

// Función para probar el endpoint
function testEndpoint() {
  console.log('\n🧪 Probando endpoint /api/recordings...');
  
  // Usar curl para probar el endpoint
  const testCommand = `curl -s http://${VPS_HOST}:5000/api/recordings | head -50`;
  
  sshCommand(testCommand, (error, stdout) => {
    if (error) {
      console.error('❌ Error probando endpoint');
      process.exit(1);
    }

    try {
      const response = JSON.parse(stdout);
      if (response.status === 'success') {
        console.log(`✅ Endpoint funciona correctamente!`);
        console.log(`📊 Grabaciones encontradas: ${response.count}`);
        
        if (response.recordings && response.recordings.length > 0) {
          console.log('\n📄 Primeras 3 grabaciones:');
          response.recordings.slice(0, 3).forEach((rec, i) => {
            console.log(`${i+1}. ${rec.filename} (${(rec.size / 1024 / 1024).toFixed(2)} MB) - ${rec.created_at}`);
          });
        }
        
        console.log('\n🎉 IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('\n💡 El frontend ahora debería mostrar todas las grabaciones automáticamente.');
      } else {
        console.error('❌ Endpoint devolvió error:', response.message);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Respuesta no es JSON válida:', stdout.substring(0, 200));
      process.exit(1);
    }
  });
}