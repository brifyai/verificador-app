#!/usr/bin/env node

/**
 * VERIFICAR RADIOS DISPONIBLES EN VPS
 */

async function checkVPSRadios() {
  console.log('=== VERIFICANDO RADIOS EN VPS ===');
  
  try {
    console.log('1. Obteniendo radios del VPS...');
    const response = await fetch('http://213.199.39.147:5000/api/radios');
    const data = await response.json();
    console.log('   Radios disponibles:', data);
    
    console.log('\n2. Verificando si hay endpoint de radios...');
    const radiosResponse = await fetch('http://213.199.39.147:5000/radios');
    const radiosData = await radiosResponse.json();
    console.log('   Radios:', radiosData);
    
  } catch (err) {
    console.error('Error:', err.message);
    
    // Intentar con diferentes endpoints
    console.log('\n🔍 Probando otros endpoints...');
    
    try {
      const radios1 = await fetch('http://213.199.39.147:5000/api/radio-list');
      console.log('   /api/radio-list:', await radios1.json());
    } catch (e) {
      console.log('   /api/radio-list: No disponible');
    }
    
    try {
      const radios2 = await fetch('http://213.199.39.147:5000/api/list-radios');
      console.log('   /api/list-radios:', await radios2.json());
    } catch (e) {
      console.log('   /api/list-radios: No disponible');
    }
  }
}

checkVPSRadios();