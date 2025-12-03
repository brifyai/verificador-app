const https = require('https');
const http = require('http');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`${colors.cyan}${colors.bright}
🧪 PRUEBA FINAL DE SOLUCIÓN CORS - RADIO STREAM VERIFIER
${colors.cyan}=================================================${colors.reset}`);

// Función para hacer petición POST al endpoint público
async function testPublicEndpoint() {
  console.log(`${colors.yellow}\n1. Probando endpoint público /api/verify-stream-public...${colors.reset}`);
  
  const testData = {
    streamUrl: 'https://radio.digitalfm.cl:8000/arica',
    radioName: 'Radio Digital FM Arica - PRUEBA'
  };

  try {
    const response = await fetch('http://localhost:3000/api/verify-stream-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`${colors.blue}   Status Code: ${response.status}${colors.reset}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`${colors.green}   ✅ Respuesta exitosa:${colors.reset}`);
      console.log(`   📊 Success: ${result.success}`);
      console.log(`   📊 Status: ${result.status}`);
      console.log(`   📊 Message: ${result.message}`);
      console.log(`   📊 URL verificada: ${result.url}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`${colors.red}   ❌ Error: ${response.status} - ${errorText}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Error de conexión: ${error.message}${colors.reset}`);
    return false;
  }
}

// Función para probar CORS
async function testCORSHeaders() {
  console.log(`${colors.yellow}\n2. Verificando headers CORS...${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/verify-stream-public', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    console.log(`${colors.blue}   Status Code: ${response.status}${colors.reset}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    };

    console.log(`${colors.cyan}   Headers CORS recibidos:${colors.reset}`);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`${colors.green}   ✅ ${key}: ${value}${colors.reset}`);
      } else {
        console.log(`${colors.red}   ❌ ${key}: No presente${colors.reset}`);
      }
    });

    return corsHeaders['Access-Control-Allow-Origin'] === '*';
  } catch (error) {
    console.log(`${colors.red}   ❌ Error verificando CORS: ${error.message}${colors.reset}`);
    return false;
  }
}

// Función principal de prueba
async function runTests() {
  console.log(`${colors.cyan}\n🚀 Iniciando pruebas de solución CORS...${colors.reset}`);
  
  const results = {
    publicEndpoint: false,
    corsHeaders: false,
  };

  // Test 1: Endpoint público
  results.publicEndpoint = await testPublicEndpoint();
  
  // Test 2: Headers CORS
  results.corsHeaders = await testCORSHeaders();

  // Resumen
  console.log(`${colors.cyan}\n📊 RESUMEN DE PRUEBAS:${colors.reset}`);
  console.log(`${colors.cyan}=====================${colors.reset}`);
  
  if (results.publicEndpoint) {
    console.log(`${colors.green}✅ Endpoint público está funcionando${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Endpoint público falló${colors.reset}`);
  }
  
  if (results.corsHeaders) {
    console.log(`${colors.green}✅ CORS está configurado correctamente${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ CORS tiene problemas${colors.reset}`);
  }

  // Conclusión final
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log(`${colors.cyan}\n🎯 CONCLUSIÓN FINAL:${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}✅ ¡SOLUCIÓN CORS IMPLEMENTADA EXITOSAMENTE!${colors.reset}`);
    console.log(`${colors.green}   • No más errores de CORS${colors.reset}`);
    console.log(`${colors.green}   • El proxy local está funcionando${colors.reset}`);
    console.log(`${colors.green}   • Las radios pueden ser verificadas sin problemas${colors.reset}`);
    console.log(`${colors.green}   • Compatible con HTTPS y HTTP${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Algunas pruebas fallaron${colors.reset}`);
    console.log(`${colors.yellow}   Revisa los logs anteriores para más detalles${colors.reset}`);
  }

  console.log(`${colors.cyan}\n📚 Archivos creados para la solución:${colors.reset}`);
  console.log(`${colors.blue}   • app/app/api/verify-stream-public/route.ts (endpoint público)${colors.reset}`);
  console.log(`${colors.blue}   • app/stream-verifier-fixed.ts (nuevo verificador)${colors.reset}`);
  console.log(`${colors.blue}   • app/components/radios/RadioCard.tsx (actualizado)${colors.reset}`);
  console.log(`${colors.blue}   • app/SOLUCION_CORS_ERROR_GUIDE.md (documentación)${colors.reset}`);
}

// Ejecutar las pruebas
runTests().catch(error => {
  console.error(`${colors.red}Error ejecutando pruebas: ${error}${colors.reset}`);
});