// Script para probar la actualización de plataformas de radio con autenticación
require('dotenv').config();

const ADMIN_EMAIL = 'admin@ondaverificada.com';
const ADMIN_PASSWORD = 'admin123';

async function authenticate() {
  console.log('🔐 Autenticando como administrador...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!response.ok) {
      throw new Error(`Error de autenticación: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Autenticación exitosa');
    return data.token;
  } catch (error) {
    console.error('❌ Error al autenticar:', error.message);
    return null;
  }
}

async function testPlatformUpdate() {
  console.log('🧪 Iniciando prueba de actualización de plataforma...\n');

  // Paso 1: Autenticar
  const authToken = await authenticate();
  if (!authToken) {
    console.log('❌ No se pudo autenticar');
    return;
  }

  // Paso 2: Obtener una radio existente
  console.log('\n📻 Paso 2: Obteniendo radio existente...');
  try {
    const getResponse = await fetch(`http://localhost:3000/api/radios?limit=1`, {
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Error obteniendo radios: ${getResponse.status}`);
    }

    const getData = await getResponse.json();
    
    if (!getData.data || getData.data.length === 0) {
      console.log('❌ No hay radios disponibles para probar');
      return;
    }

    const radio = getData.data[0];
    console.log(`✅ Radio encontrada: ${radio.name} (ID: ${radio.id})`);
    console.log(`📊 Plataforma actual: ${radio.streamPlatform}`);
    console.log(`🔗 URL actual: ${radio.streamUrl}\n`);

    // Paso 3: Preparar datos de actualización con nueva plataforma
    const updateData = {
      name: radio.name,
      streamUrl: radio.streamUrl,
      streamPlatform: 'youtube', // Cambiar a YouTube
      region: radio.region,
      isActive: radio.isActive,
      genre: radio.genre,
      programadora: radio.programadora,
      frequency: radio.frequency,
      city: radio.city,
      website: radio.website
    };

    console.log('📝 Paso 3: Preparando actualización...');
    console.log('Datos a enviar:', JSON.stringify(updateData, null, 2));
    console.log(`🔄 Cambiando plataforma de "${radio.streamPlatform}" a "youtube"\n`);

    // Paso 4: Enviar actualización
    console.log('🚀 Paso 4: Enviando actualización...');
    const updateResponse = await fetch(`http://localhost:3000/api/radios/${radio.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify(updateData)
    });

    console.log(`📡 Código de respuesta: ${updateResponse.status}`);
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.log('❌ Error en la respuesta:', errorData);
      return;
    }

    const result = await updateResponse.json();
    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(result, null, 2));

    // Paso 5: Verificar el resultado
    console.log('\n🔍 Paso 5: Verificando resultado...');
    const updatedRadio = result.data;
    
    console.log(`📻 Radio actualizada: ${updatedRadio.name}`);
    console.log(`📊 Plataforma esperada: youtube`);
    console.log(`📊 Plataforma recibida: ${updatedRadio.streamPlatform}`);
    
    if (updatedRadio.streamPlatform === 'youtube') {
      console.log('✅ ✅ ✅ ÉXITO: La plataforma se actualizó correctamente');
    } else {
      console.log('❌ ❌ ❌ ERROR: La plataforma no se actualizó correctamente');
      console.log(`❌ Esperado: youtube, Recibido: ${updatedRadio.streamPlatform}`);
      
      // Análisis detallado
      console.log('\n🔍 Análisis detallado:');
      console.log(`- Plataforma enviada: ${updateData.streamPlatform}`);
      console.log(`- Plataforma recibida: ${updatedRadio.streamPlatform}`);
      console.log(`- ¿Coincide?: ${updateData.streamPlatform === updatedRadio.streamPlatform ? 'SÍ' : 'NO'}`);
    }

    // Paso 6: Verificar en base de datos
    console.log('\n🗄️ Paso 6: Verificando en base de datos...');
    const verifyResponse = await fetch(`http://localhost:3000/api/radios/${radio.id}`, {
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    const verifyData = await verifyResponse.json();
    
    if (verifyData.data) {
      console.log(`📊 Plataforma en BD: ${verifyData.data.streamPlatform}`);
      if (verifyData.data.streamPlatform === 'youtube') {
        console.log('✅ Base de datos actualizada correctamente');
      } else {
        console.log('❌ Base de datos no actualizada');
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testPlatformUpdate().catch(console.error);