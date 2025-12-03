#!/usr/bin/env node

/**
 * OBTENER RADIOS DE LA APLICACIÓN
 */

async function getAppRadios() {
  console.log('=== OBTENIENDO RADIOS DE LA APLICACIÓN ===');
  
  try {
    // Usar la API de la aplicación con token
    const response = await fetch('http://localhost:3000/api/radios-direct', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MzE2MjM4NzIsImV4cCI6MjA0NzE5OTg3Mn0.ZgHl8m9W3W9d7v5y5f5f5f5f5f5f5f5f5f5f5f5f5f',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log(`Encontradas: ${data.radios?.length || 0} radios`);
    
    if (data.radios && data.radios.length > 0) {
      console.log('\nPrimeras 20 radios:');
      data.radios.slice(0, 20).forEach((radio, i) => {
        console.log(`   ${i + 1}. ID: "${radio.id_radio}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
      });
      
      if (data.radios.length > 20) {
        console.log(`   ... y ${data.radios.length - 20} radios más`);
      }
      
      // Buscar radios específicas
      console.log('\nBuscando radios específicas...');
      const targetRadios = data.radios.filter(r => 
        r.id_radio.includes('mijm9xci') || 
        r.id_radio.includes('mijm9xsi') ||
        r.name.toLowerCase().includes('contagio') ||
        r.name.toLowerCase().includes('digital') ||
        r.name.toLowerCase().includes('somos')
      );
      
      if (targetRadios.length > 0) {
        console.log('Radios encontradas que necesitan mapeo:');
        targetRadios.forEach((radio, i) => {
          console.log(`   ${i + 1}. ID: "${radio.id_radio}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
        });
      } else {
        console.log('❌ No se encontraron radios con IDs alfanuméricos');
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getAppRadios();