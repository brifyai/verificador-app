#!/usr/bin/env node

// Script para verificar la sesión actual y el menú que se muestra
const { execSync } = require('child_process');

console.log('🔍 Diagnóstico de Sesión y Menú Actual');
console.log('=======================================\n');

// Verificar si hay cookies de sesión
try {
  console.log('📋 Verificando cookies de sesión...');
  
  // Intentar obtener la sesión actual desde el servidor
  const result = execSync('curl -s http://localhost:3000/api/auth/me -H "Cookie: $(cat .next/cache/cookies 2>/dev/null || echo \'\')" || echo "No hay respuesta"', { encoding: 'utf8' });
  console.log('Respuesta de /api/auth/me:', result || 'Sin respuesta');
  
} catch (error) {
  console.log('❌ Error verificando sesión:', error.message);
}

console.log('\n🔍 Verificación de acceso directo a páginas:');

// Probar acceso directo a las páginas
const pages = [
  { name: 'Grabaciones', url: 'http://localhost:3000/grabaciones' },
  { name: 'Audios', url: 'http://localhost:3000/audios' },
  { name: 'Radios', url: 'http://localhost:3000/radios' }
];

pages.forEach(page => {
  try {
    console.log(`\n📍 Probando ${page.name} (${page.url})...`);
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${page.url}`, { encoding: 'utf8' });
    console.log(`   Código de respuesta: ${response}`);
    
    if (response === '200') {
      console.log(`   ✅ Página accesible`);
    } else if (response === '307' || response === '302') {
      console.log(`   🔒 Redirigiendo (probablemente al login)`);
    } else if (response === '404') {
      console.log(`   ❌ Página no encontrada`);
    } else {
      console.log(`   ⚠️  Código ${response}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
});

console.log('\n💡 Recomendaciones:');
console.log('1. Asegúrate de haber iniciado sesión como ADMIN');
console.log('2. Verifica que la sesión esté activa');
console.log('3. Prueba acceder directamente a las URLs');
console.log('4. Revisa la consola del navegador (F12) para errores');

console.log('\n🔧 URLs de prueba:');
pages.forEach(page => {
  console.log(`   ${page.url}`);
});