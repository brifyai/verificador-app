// 🔍 SCRIPT PARA VERIFICAR STREAM DE RADIO DIGITAL
// Ejecutar en consola para diagnosticar el problema del stream

console.log('=== VERIFICACIÓN DE STREAM DE RADIO DIGITAL ===');
console.log('URL del stream: https://radio.digitalfm.cl:8000/iquique2');
console.log('');

// Método 1: Verificar con fetch (más similar a nuestro verificador)
async function verificarStreamFetch() {
  console.log('📡 Método 1: Verificando con fetch...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch('https://radio.digitalfm.cl:8000/iquique2', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Verificador de Radio)'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('✅ Fetch HEAD exitoso');
    console.log('📊 Estado:', response.status, response.statusText);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (error) {
    console.log('❌ Fetch HEAD falló:', error.message);
    
    // Intentar con GET como fallback
    try {
      console.log('🔄 Intentando con GET...');
      const response = await fetch('https://radio.digitalfm.cl:8000/iquique2', {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Verificador de Radio)'
        }
      });
      
      console.log('✅ Fetch GET exitoso');
      console.log('📊 Estado:', response.status, response.statusText);
      
    } catch (getError) {
      console.log('❌ Fetch GET también falló:', getError.message);
    }
  }
}

// Método 2: Verificar con XMLHttpRequest (más detallado)
function verificarStreamXHR() {
  console.log('');
  console.log('📡 Método 2: Verificando con XMLHttpRequest...');
  
  const xhr = new XMLHttpRequest();
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      console.log('✅ XHR completado');
      console.log('📊 Estado:', xhr.status, xhr.statusText);
      console.log('📋 Headers:', xhr.getAllResponseHeaders());
      console.log('📄 Respuesta:', xhr.responseText.substring(0, 200));
    }
  };
  
  xhr.onerror = function() {
    console.log('❌ XHR error:', xhr.status, xhr.statusText);
  };
  
  xhr.ontimeout = function() {
    console.log('⏰ XHR timeout');
  };
  
  xhr.open('HEAD', 'https://radio.digitalfm.cl:8000/iquique2', true);
  xhr.timeout = 5000; // 5 segundos
  xhr.setRequestHeader('User-Agent', 'Verificador de Radio');
  xhr.send();
}

// Método 3: Verificar si el dominio responde
async function verificarDominio() {
  console.log('');
  console.log('📡 Método 3: Verificando solo el dominio...');
  
  try {
    const response = await fetch('https://radio.digitalfm.cl:8000/', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('✅ Dominio principal accesible');
    console.log('📊 Estado:', response.status);
    
  } catch (error) {
    console.log('❌ Dominio principal también falló:', error.message);
  }
}

// Método 4: Verificar otros streams del mismo servidor
async function verificarOtrosStreams() {
  console.log('');
  console.log('📡 Método 4: Verificando otros streams del mismo servidor...');
  
  const streams = [
    'https://radio.digitalfm.cl:8000/arica',
    'https://radio.digitalfm.cl:8000/iquique',
    'https://radio.digitalfm.cl:8000/stream'
  ];
  
  for (const streamUrl of streams) {
    try {
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      
      console.log(`✅ ${streamUrl} - Accesible`);
      
    } catch (error) {
      console.log(`❌ ${streamUrl} - Falló: ${error.message}`);
    }
  }
}

// Ejecutar todas las verificaciones
console.log('⏳ Ejecutando verificaciones...');
console.log('');

verificarStreamFetch();
setTimeout(() => verificarStreamXHR(), 2000);
setTimeout(() => verificarDominio(), 4000);
setTimeout(() => verificarOtrosStreams(), 6000);

console.log('');
console.log('⏰ Todas las verificaciones se ejecutarán en los próximos 10 segundos...');
console.log('📊 Resultados aparecerán arriba ↑');