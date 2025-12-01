const fs = require('fs');
const path = require('path');

// Leer el token desde el archivo
function getToken() {
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

// Función para verificar el stream
async function verifyStream(url) {
  try {
    console.log(`🔍 Verificando stream: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow',
      timeout: 10000
    });

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    console.log('Stream Status:', response.status);
    console.log('Stream Headers:', headers);

    if (response.status === 200) {
      const contentType = headers['content-type'] || '';
      const server = headers['server'] || '';
      const icyName = headers['icy-name'] || '';
      const icyBr = headers['icy-br'] || '';

      console.log('✅ Stream verificado exitosamente');
      console.log('📊 Tipo de contenido:', contentType);
      console.log('🖥️ Servidor:', server);
      console.log('📻 Nombre:', icyName);
      console.log('🔊 Bitrate:', icyBr);

      return {
        online: true,
        statusCode: response.status,
        contentType,
        server,
        icyName,
        icyBr
      };
    } else {
      console.log('❌ Stream no disponible');
      return {
        online: false,
        statusCode: response.status
      };
    }
  } catch (error) {
    console.log('❌ Error al verificar stream:', error.message);
    return {
      online: false,
      error: error.message
    };
  }
}

// Función para actualizar Radio Contagio
async function updateRadioContagio() {
  const token = getToken();
  const radioId = 'radio_mijm9ygp_qs015py'; // ID correcto de Radio Contagio
  const newUrl = 'https://sonic.streamingchilenos.com:7114/';
  
  try {
    console.log('🔄 Iniciando actualización de Radio Contagio...');
    console.log(`📻 ID: ${radioId}`);
    console.log(`🔗 Nueva URL: ${newUrl}`);

    // Verificar el stream primero
    const verification = await verifyStream(newUrl);
    
    if (!verification.online) {
      console.log('❌ El stream no está disponible, no se actualizará');
      return;
    }

    console.log('✅ Stream verificado, procediendo con la actualización...');

    // Obtener información actual de la radio
    console.log('\n🔍 Obteniendo información actual...');
    const getResponse = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Error al obtener información: ${getResponse.status}`);
    }

    const radioData = await getResponse.json();
    console.log('📻 Información actual:');
    console.log(`   Nombre: ${radioData.name || 'Sin nombre'}`);
    console.log(`   URL actual: ${radioData.streamUrl || 'Sin URL'}`);
    console.log(`   Estado: ${radioData.status || 'Sin estado'}`);
    console.log(`   Región: ${radioData.region || 'Sin región'}`);

    // Actualizar la radio
    console.log('\n🔄 Actualizando Radio Contagio...');
    console.log(`De: ${radioData.streamUrl || 'Sin URL'}`);
    console.log(`A: ${newUrl}`);

    const updateData = {
      streamUrl: newUrl,
      status: 'ACTIVE',
      lastVerificationStatus: 'ONLINE',
      lastVerifiedAt: new Date().toISOString()
    };

    const updateResponse = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      throw new Error(`Error al actualizar: ${updateResponse.status}`);
    }

    const result = await updateResponse.json();
    console.log('✅ Radio Contagio actualizada exitosamente');
    console.log('📊 Datos actualizados:', {
      id: radioId,
      nombre: radioData.name,
      nueva_url: newUrl,
      estado: 'ACTIVE',
      verificacion: 'ONLINE'
    });

    // Verificar la actualización
    console.log('\n🔍 Verificando la actualización...');
    const verifyResponse = await fetch(`http://localhost:3000/api/radios/${radioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.ok) {
      const updatedData = await verifyResponse.json();
      console.log('✅ Verificación exitosa:');
      console.log(`   Nombre: ${updatedData.name}`);
      console.log(`   URL: ${updatedData.streamUrl}`);
      console.log(`   Estado: ${updatedData.lastVerificationStatus}`);
      console.log(`   Última verificación: ${updatedData.lastVerifiedAt}`);
    }

  } catch (error) {
    console.error('❌ Error al actualizar Radio Contagio:', error);
  }
}

// Ejecutar
updateRadioContagio();