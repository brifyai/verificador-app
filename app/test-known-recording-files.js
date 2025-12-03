#!/usr/bin/env node

/**
 * VERIFICAR: Archivos de grabación específicos conocidos
 * Basado en los logs del servidor que muestran las grabaciones procesadas
 */

const axios = require('axios');
const colors = require('colors');

// Archivos conocidos desde los logs del servidor
const KNOWN_RECORDINGS = [
  'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
  'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
];

// Función para verificar si un archivo existe en el VPS
async function checkFileExists(filename) {
  const vpsUrl = `http://213.199.39.147:5000/recordings/${filename}`;
  
  try {
    console.log(`🔍 Verificando: ${filename}`);
    console.log(`   URL: ${vpsUrl}`);
    
    // Intentar HEAD request primero
    const headResponse = await axios.head(vpsUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    if (headResponse.status === 200) {
      const size = headResponse.headers['content-length'] || 'Desconocido';
      const type = headResponse.headers['content-type'] || 'Desconocido';
      console.log(`   ✅ ARCHIVO EXISTE (HEAD)`);
      console.log(`   📏 Tamaño: ${size} bytes`);
      console.log(`   📄 Tipo: ${type}`);
      
      // También probar GET para confirmar que se puede descargar
      try {
        const getResponse = await axios.get(vpsUrl, {
          timeout: 10000,
          responseType: 'arraybuffer',
          validateStatus: (status) => status < 500
        });
        
        if (getResponse.status === 200) {
          const downloadSize = getResponse.data.byteLength;
          console.log(`   ✅ DESCARGA EXITOSA`);
          console.log(`   📥 Tamaño descargado: ${downloadSize} bytes`);
          return { 
            exists: true, 
            status: headResponse.status, 
            size, 
            type,
            downloadSuccess: true,
            downloadSize
          };
        } else {
          console.log(`   ⚠️ GET falló con código: ${getResponse.status}`);
          return { 
            exists: true, 
            status: headResponse.status, 
            size, 
            type,
            downloadSuccess: false,
            getStatus: getResponse.status
          };
        }
      } catch (getError) {
        console.log(`   ⚠️ GET error: ${getError.message}`);
        return { 
          exists: true, 
          status: headResponse.status, 
          size, 
          type,
          downloadSuccess: false,
          getError: getError.message
        };
      }
      
    } else if (headResponse.status === 404) {
      console.log(`   ❌ ARCHIVO NO EXISTE (404)`);
      return { exists: false, status: headResponse.status };
    } else {
      console.log(`   ⚠️ CÓDIGO HTTP: ${headResponse.status}`);
      return { exists: false, status: headResponse.status };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`   🚫 VPS NO ACCESIBLE (Conexión rechazada)`);
      console.log(`   💡 El VPS 213.199.39.147:5000 no responde`);
      return { exists: false, error: 'VPS_NO_ACCESSIBLE', code: 'ECONNREFUSED' };
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   ⏰ TIMEOUT - VPS muy lento o inaccesible`);
      return { exists: false, error: 'TIMEOUT', code: 'ETIMEDOUT' };
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   🌐 DNS ERROR - No se puede resolver el dominio`);
      return { exists: false, error: 'DNS_ERROR', code: 'ENOTFOUND' };
    } else {
      console.log(`   ❌ ERROR: ${error.message}`);
      return { exists: false, error: error.message };
    }
  }
}

// Función para verificar el directorio de grabaciones
async function checkRecordingsDirectory() {
  const dirUrl = 'http://213.199.39.147:5000/recordings/';
  
  try {
    console.log(`\n📁 Verificando directorio: ${dirUrl}`);
    
    const response = await axios.get(dirUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      console.log(`   ✅ Directorio accesible`);
      console.log(`   📄 Tipo de respuesta: ${response.headers['content-type']}`);
      
      // Si es HTML, puede ser un listado de directorio
      if (response.headers['content-type']?.includes('text/html')) {
        console.log(`   📋 Posible listado de directorio en HTML`);
      }
      
      return { directoryAccessible: true, contentType: response.headers['content-type'] };
    } else {
      console.log(`   ❌ Directorio no accesible - Código: ${response.status}`);
      return { directoryAccessible: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Error accediendo al directorio: ${error.message}`);
    return { directoryAccessible: false, error: error.message };
  }
}

// Función principal
async function main() {
  console.log(colors.cyan.bold('\n=== DIAGNÓSTICO: ARCHIVOS FANTASMA EN VPS ===\n'));
  console.log('Verificando archivos específicos conocidos desde los logs del servidor\n');
  
  try {
    // 1. Verificar directorio de grabaciones
    const dirResult = await checkRecordingsDirectory();
    
    // 2. Verificar cada archivo conocido
    console.log(colors.cyan.bold('\n=== VERIFICANDO ARCHIVOS ESPECÍFICOS ===\n'));
    
    const results = [];
    
    for (let i = 0; i < KNOWN_RECORDINGS.length; i++) {
      const filename = KNOWN_RECORDINGS[i];
      console.log(colors.bold(`\n--- ARCHIVO ${i + 1} ---`));
      
      const result = await checkFileExists(filename);
      results.push({
        filename,
        ...result
      });
      
      console.log(''); // Línea en blanco
    }
    
    // 3. Resumen final
    console.log(colors.cyan.bold('\n=== RESUMEN FINAL ===\n'));
    
    const existing = results.filter(r => r.exists).length;
    const notExisting = results.filter(r => !r.exists).length;
    const downloadSuccess = results.filter(r => r.downloadSuccess).length;
    const connectionErrors = results.filter(r => r.code === 'ECONNREFUSED' || r.code === 'ETIMEDOUT' || r.code === 'ENOTFOUND').length;
    
    console.log(`📊 Total archivos verificados: ${results.length}`);
    console.log(`✅ Archivos que existen: ${existing}`);
    console.log(`❌ Archivos que NO existen: ${notExisting}`);
    console.log(`📥 Descargas exitosas: ${downloadSuccess}`);
    console.log(`🚫 Errores de conexión: ${connectionErrors}`);
    
    if (connectionErrors > 0) {
      console.log(colors.red('\n🚨 PROBLEMA DE CONECTIVIDAD DETECTADO'));
      console.log('El VPS no es accesible desde este script.');
      console.log('Posibles causas:');
      console.log('1. VPS apagado o reiniciando');
      console.log('2. Firewall bloqueando conexiones');
      console.log('3. Servicio de grabaciones no iniciado');
      console.log('4. Problema de red');
      
      console.log(colors.cyan.bold('\n🔧 SOLUCIONES RECOMENDADAS:'));
      console.log('1. Verificar que el VPS esté encendido y accesible');
      console.log('2. Comprobar el estado del servicio de grabaciones');
      console.log('3. Verificar configuración de firewall');
      console.log('4. Probar conexión manual: curl http://213.199.39.147:5000/recordings/');
    }
    
    if (notExisting > 0 && connectionErrors === 0) {
      console.log(colors.yellow('\n⚠️ ARCHIVOS FANTASMA CONFIRMADOS'));
      console.log('Estos archivos tienen metadatos pero no existen físicamente:');
      
      results.filter(r => !r.exists).forEach(r => {
        console.log(`   - ${r.filename}`);
        if (r.status === 404) {
          console.log(`     (Error 404 - Archivo no encontrado)`);
        } else if (r.error) {
          console.log(`     Error: ${r.error}`);
        }
      });
      
      console.log(colors.cyan.bold('\n🔧 SOLUCIONES RECOMENDADAS:'));
      console.log('1. Limpiar metadatos de archivos inexistentes de la base de datos');
      console.log('2. Verificar el proceso de grabación en el VPS');
      console.log('3. Organizar archivos según estructura día/radio/grabaciones');
      console.log('4. Implementar verificación de existencia antes de mostrar URLs');
    }
    
    if (existing > 0 && downloadSuccess === existing) {
      console.log(colors.green('\n✅ ARCHIVOS REALES Y ACCESIBLES'));
      console.log('Todos los archivos existen y se pueden descargar correctamente.');
    } else if (existing > 0 && downloadSuccess < existing) {
      console.log(colors.yellow('\n⚠️ ARCHIVOS PARCIALMENTE ACCESIBLES'));
      console.log('Algunos archivos existen pero no se pueden descargar.');
    }
    
    console.log(colors.cyan.bold('\n=== FIN DEL DIAGNÓSTICO ===\n'));
    
  } catch (err) {
    console.log(colors.red(`Error en diagnóstico: ${err.message}`));
    console.error(err);
  }
}

// Ejecutar
main().catch(err => {
  console.log(colors.red(`Error inesperado: ${err.message}`));
  console.error(err);
});