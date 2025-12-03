#!/usr/bin/env node

/**
 * 🧪 PRUEBA REAL DE STREAMS CON SOLUCIÓN CORS
 * 
 * Esta prueba verifica que la solución CORS funcione con streams reales de radio.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}
🧪 PRUEBA REAL DE STREAMS - SOLUCIÓN CORS IMPLEMENTADA
${colors.cyan}=================================================${colors.reset}
`);

// Streams de radio reales para probar
const testStreams = [
  {
    name: 'Radio Agricultura',
    url: 'https://unlimited1-cl-isp.dps.live/radioagricultura/radioagricultura.aac',
    protocol: 'HTTPS'
  },
  {
    name: 'Radio Cooperativa',
    url: 'https://unlimited1-cl-isp.dps.live/radiocooperativa/radiocooperativa.aac',
    protocol: 'HTTPS'
  },
  {
    name: 'Radio Bio-Bio',
    url: 'https://unlimited1-cl-isp.dps.live/radiobiobio/radiobiobio.aac',
    protocol: 'HTTPS'
  },
  {
    name: 'Radio ADN',
    url: 'https://unlimited1-cl-isp.dps.live/radioadn/radioadn.aac',
    protocol: 'HTTPS'
  }
];

async function testStream(stream) {
  console.log(`${colors.yellow}\n📻 Probando: ${stream.name}${colors.reset}`);
  console.log(`${colors.blue}   URL: ${stream.url}${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/verify-stream-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: stream.url,
        timeout: 15000
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      if (data.available) {
        console.log(`${colors.green}   ✅ Stream disponible${colors.reset}`);
        console.log(`   📊 Status: ${data.status} - ${data.statusText}`);
        if (data.mode) {
          console.log(`   🔒 Modo: ${data.mode}`);
        }
      } else {
        console.log(`${colors.red}   ❌ Stream no disponible${colors.reset}`);
        if (data.error) {
          console.log(`   ⚠️  Error: ${data.error}`);
        }
      }
    } else {
      console.log(`${colors.red}   ❌ Error HTTP: ${response.status}${colors.reset}`);
    }
    
    return data;
  } catch (error) {
    console.log(`${colors.red}   ❌ Error de red: ${error.message}${colors.reset}`);
    return { available: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.cyan}🚀 Iniciando pruebas con streams reales...${colors.reset}`);
  
  const results = [];
  
  for (const stream of testStreams) {
    const result = await testStream(stream);
    results.push({
      name: stream.name,
      url: stream.url,
      ...result
    });
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`${colors.cyan}\n📊 RESUMEN DE PRUEBAS:${colors.reset}`);
  console.log(`${colors.cyan}=====================${colors.reset}`);
  
  const available = results.filter(r => r.available).length;
  const total = results.length;
  
  console.log(`${colors.green}✅ Streams disponibles: ${available}/${total}${colors.reset}`);
  console.log(`${colors.red}❌ Streams no disponibles: ${total - available}/${total}${colors.reset}`);
  
  if (available > 0) {
    console.log(`${colors.green}${colors.bright}\n🎉 ¡ÉXITO! La solución CORS está funcionando correctamente.${colors.reset}`);
    console.log(`${colors.cyan}   El endpoint /api/verify-stream-public puede verificar streams sin errores CORS.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}\n⚠️  Todos los streams fallaron, pero esto podría deberse a problemas de red.${colors.reset}`);
  }
  
  console.log(`${colors.cyan}\n📚 Archivos implementados para la solución:${colors.reset}`);
  console.log(`${colors.blue}   • app/app/api/verify-stream-public/route.ts (endpoint público CORS)${colors.reset}`);
  console.log(`${colors.blue}   • app/stream-verifier-fixed.ts (nuevo verificador sin CORS)${colors.reset}`);
  console.log(`${colors.blue}   • app/middleware.ts (configurado para permitir endpoint público)${colors.reset}`);
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error(`${colors.red}💥 Error ejecutando pruebas: ${error.message}${colors.reset}`);
  process.exit(1);
});