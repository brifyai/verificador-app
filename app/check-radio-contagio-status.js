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

async function checkRadioContagioStatus() {
  const token = getToken();
  if (!token) {
    console.error('❌ No se pudo obtener el token');
    return;
  }

  console.log('🔍 Buscando Radio Contagio por ID...');
  console.log('📻 ID: radio_mijm9ygp_qs015py');
  
  try {
    // Buscar la radio específica por ID
    const response = await fetch('http://localhost:3000/api/radios-direct', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Total de radios encontradas: ${data.radios.length}`);
    
    // Buscar Radio Contagio específicamente
    const radioContagio = data.radios.find(radio => 
      radio.id === 'radio_mijm9ygp_qs015py' || 
      radio.name?.toLowerCase().includes('contagio') ||
      radio.stream_url?.includes('7114')
    );
    
    if (radioContagio) {
      console.log('\n✅ ¡RADIO CONTAGIO ENCONTRADA!');
      console.log('📻 Nombre:', radioContagio.name);
      console.log('🔗 URL:', radioContagio.stream_url);
      console.log('📊 Estado:', radioContagio.status);
      console.log('🕐 Última verificación:', radioContagio.last_verified);
      console.log('📡 Verificación activa:', radioContagio.is_verified ? 'Sí' : 'No');
      
      if (radioContagio.status === 'ONLINE') {
        console.log('\n🎉 ¡RADIO CONTAGIO ESTÁ ONLINE! 🎉');
      } else {
        console.log('\n⚠️  Radio Contagio está:', radioContagio.status);
      }
    } else {
      console.log('\n❌ No se encontró Radio Contagio con el ID específico');
      
      // Mostrar algunas radios que contengan "sonic" para verificar
      const sonicRadios = data.radios.filter(radio => 
        radio.stream_url?.includes('sonic.streamingchilenos.com')
      );
      
      if (sonicRadios.length > 0) {
        console.log('\n📻 Radios con sonic.streamingchilenos.com encontradas:');
        sonicRadios.forEach(radio => {
          console.log(`  - ${radio.name} (${radio.id}): ${radio.stream_url} - Estado: ${radio.status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error al buscar Radio Contagio:', error.message);
  }
}

// Ejecutar
checkRadioContagioStatus();
