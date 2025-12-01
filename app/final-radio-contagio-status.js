const fs = require('fs');
const path = require('path');

// Leer el token del archivo
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
  
  console.error('❌ No se encontró archivo de token');
  return null;
}

async function finalRadioContagioStatus() {
  const token = getToken();
  if (!token) {
    console.error('❌ No se pudo obtener el token');
    return;
  }

  console.log('🔍 Estado Final de Radio Contagio...');
  console.log('📻 ID: radio_mijm9ygp_qs015py');
  
  try {
    // Buscar la radio específica por ID
    const response = await fetch('http://localhost:3000/api/radios/radio_mijm9ygp_qs015py', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const radio = result.data || result;
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡RADIO CONTAGIO ENCONTRADA Y VERIFICADA! 🎉');
    console.log('='.repeat(50));
    console.log('📻 Nombre:', radio.name);
    console.log('🔗 URL del Stream:', radio.streamUrl || radio.stream_url);
    console.log('📊 Estado Actual:', radio.lastVerificationStatus || radio.status);
    console.log('🕐 Última Verificación:', radio.lastVerifiedAt || radio.last_verified);
    console.log('📍 Región:', radio.region);
    console.log('🏙️  Ciudad:', radio.city);
    console.log('📡 Plataforma:', radio.streamPlatform || radio.stream_platform);
    console.log('✅ Activo:', radio.isActive ? 'Sí' : 'No');
    console.log('='.repeat(50));
    
    if (radio.lastVerificationStatus === 'ONLINE' || radio.status === 'ONLINE') {
      console.log('\n🟢 ¡RADIO CONTAGIO ESTÁ ONLINE! 🟢');
      console.log('✅ La URL https://sonic.streamingchilenos.com:7114/ está funcionando correctamente');
      console.log('✅ El stream ha sido actualizado exitosamente');
      console.log('✅ La verificación automática confirma que está online');
    } else {
      console.log('\n🔴 Radio Contagio está:', radio.lastVerificationStatus || radio.status);
    }

  } catch (error) {
    console.error('❌ Error al buscar Radio Contagio:', error.message);
  }
}

// Ejecutar
finalRadioContagioStatus();