const fs = require('fs');
const path = require('path');

// Leer el token de autenticación
function getAuthToken() {
  const tokenPaths = [
    path.join(__dirname, 'admin-token.txt'),
    path.join(__dirname, 'valid-token.txt')
  ];
  
  for (const tokenPath of tokenPaths) {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf8').trim();
    }
  }
  
  throw new Error('No se encontró token de autenticación');
}

// Función para verificar un stream específico
async function verifyStream(url) {
  try {
    console.log(`🔍 Verificando stream: ${url}`);
    
    // Primero intentar con fetch normal
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Icy-MetaData': '1'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const server = response.headers.get('server') || '';
      const icyName = response.headers.get('icy-name') || '';
      const icyGenre = response.headers.get('icy-genre') || '';
      const icyBr = response.headers.get('icy-br') || '';

      console.log(`✅ Stream verificado exitosamente`);
      console.log(`📊 Tipo de contenido: ${contentType}`);
      console.log(`🖥️ Servidor: ${server}`);
      console.log(`📻 Nombre: ${icyName || 'No disponible'}`);
      console.log(`🎵 Género: ${icyGenre || 'No disponible'}`);
      console.log(`🔊 Bitrate: ${icyBr ? icyBr + ' kbps' : 'No disponible'}`);

      return {
        status: 'ONLINE',
        contentType,
        server,
        name: icyName,
        genre: icyGenre,
        bitrate: icyBr
      };
    } else {
      console.log(`❌ Stream offline - Status: ${response.status}`);
      return { status: 'OFFLINE', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Error en verificación: ${error.message}`);
    
    // Si falla con fetch, intentar con el módulo HTTPS para streams problemáticos
    if (url.startsWith('https://')) {
      console.log(`🔄 Intentando con módulo HTTPS...`);
      return await verifyWithHttps(url);
    }
    
    return { status: 'OFFLINE', error: error.message };
  }
}

// Función para verificar con módulo HTTPS
async function verifyWithHttps(url) {
  return new Promise((resolve) => {
    const https = require('https');
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Icy-MetaData': '1'
      },
      timeout: 10000,
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      console.log(`📊 HTTPS Status: ${res.statusCode}`);
      console.log(`📋 HTTPS Headers:`, res.headers);

      if (res.statusCode === 200) {
        const contentType = res.headers['content-type'] || '';
        const server = res.headers['server'] || '';
        const icyName = res.headers['icy-name'] || '';
        const icyGenre = res.headers['icy-genre'] || '';
        const icyBr = res.headers['icy-br'] || '';

        console.log(`✅ Stream verificado con HTTPS`);
        resolve({
          status: 'ONLINE',
          contentType,
          server,
          name: icyName,
          genre: icyGenre,
          bitrate: icyBr
        });
      } else {
        resolve({ status: 'OFFLINE', error: `HTTP ${res.statusCode}` });
      }
      
      req.destroy();
    });

    req.on('error', (error) => {
      console.log(`❌ Error HTTPS: ${error.message}`);
      resolve({ status: 'OFFLINE', error: error.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ Timeout HTTPS`);
      req.destroy();
      resolve({ status: 'OFFLINE', error: 'Timeout' });
    });

    req.end();
  });
}

// Función principal
async function main() {
  try {
    console.log('🔍 Verificando Radio Contagio específicamente...');
    
    // Obtener token
    const token = getAuthToken();
    console.log(`🔑 Token encontrado: ${token.substring(0, 20)}...`);
    
    // ID de Radio Contagio
    const radioId = 'radio_mijm9ygp_qs015py';
    const streamUrl = 'https://sonic.streamingchilenos.com:7114/';
    
    console.log(`📻 ID: ${radioId}`);
    console.log(`🔗 URL: ${streamUrl}`);
    
    // Verificar el stream
    const result = await verifyStream(streamUrl);
    
    if (result.status === 'ONLINE') {
      console.log(`\n✅ ¡Stream ONLINE!`);
      console.log(`Actualizando estado en la base de datos...`);
      
      // Actualizar el estado en la base de datos
      const updateResponse = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stream_url: streamUrl,
          status: 'ACTIVE',
          last_check: new Date().toISOString(),
          verification_status: 'ONLINE',
          verification_details: {
            server: result.server,
            content_type: result.contentType,
            name: result.name,
            genre: result.genre,
            bitrate: result.bitrate
          }
        })
      });

      if (updateResponse.ok) {
        console.log(`✅ Estado actualizado en la base de datos`);
        
        // Verificar la actualización
        const verifyResponse = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (verifyResponse.ok) {
          const data = await verifyResponse.json();
          console.log(`\n📊 Estado final:`);
          console.log(`   Nombre: ${data.name}`);
          console.log(`   URL: ${data.stream_url}`);
          console.log(`   Estado: ${data.status}`);
          console.log(`   Verificación: ${data.verification_status}`);
          console.log(`   Última verificación: ${data.last_check}`);
        }
      } else {
        console.log(`❌ Error al actualizar: ${updateResponse.status}`);
      }
    } else {
      console.log(`\n❌ Stream sigue OFFLINE: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Ejecutar
main().catch(console.error);