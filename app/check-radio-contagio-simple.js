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

async function checkRadioContagioSimple() {
  const token = getToken();
  if (!token) {
    console.error('❌ No se pudo obtener el token');
    return;
  }

  console.log('🔍 Verificando Radio Contagio directamente...');
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

    const radio = await response.json();
    console.log('\n✅ RADIO ENCONTRADA!');
    console.log('📻 Nombre:', radio.name);
    console.log('🔗 URL:', radio.stream_url);
    console.log('📊 Estado:', radio.status);
    console.log('🕐 Última verificación:', radio.last_verified);
    console.log('📡 Verificación activa:', radio.is_verified ? 'Sí' : 'No');
    
    if (radio.status === 'ONLINE') {
      console.log('\n🎉 ¡RADIO CONTAGIO ESTÁ ONLINE! 🎉');
    } else {
      console.log('\n⚠️  Radio Contagio está:', radio.status);
    }

  } catch (error) {
    console.error('❌ Error al buscar Radio Contagio:', error.message);
  }
}

// Ejecutar
checkRadioContagioSimple();