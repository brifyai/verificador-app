#!/usr/bin/env node

/**
 * VERIFICACIÓN SIMPLE DEL VPS
 */

async function checkVPS() {
  console.log('=== VERIFICANDO VPS ===');
  
  try {
    console.log('1. Verificando grabaciones activas...');
    const activeResponse = await fetch('http://213.199.39.147:5000/api/active-recordings');
    const activeData = await activeResponse.json();
    console.log('   Activas:', activeData);
    
    console.log('\n2. Verificando todas las grabaciones...');
    const allResponse = await fetch('http://213.199.39.147:5000/api/recordings');
    const allData = await allResponse.json();
    console.log('   Todas:', allData);
    
    console.log('\n3. Verificando si hay archivos en el directorio...');
    const filesResponse = await fetch('http://213.199.39.147:5000/api/files');
    const filesData = await filesResponse.json();
    console.log('   Archivos:', filesData);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkVPS();