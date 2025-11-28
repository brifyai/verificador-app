const axios = require('axios');

const API_BASE = 'http://213.199.39.147:5000/api';

async function diagnoseRecordings() {
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE GRABACIONES\n');
  
  try {
    // 1. Obtener grabaciones desde VPS
    console.log('📡 Obteniendo grabaciones desde VPS...');
    const response = await axios.get(`${API_BASE}/recordings`);
    const recordings = response.data.recordings || [];
    
    console.log(`✅ Total grabaciones en VPS: ${recordings.length}\n`);
    
    // 2. Analizar cada grabación
    console.log('🔍 Analizando cada grabación:\n');
    
    const analysis = recordings.map((rec, index) => {
      const issues = [];
      
      // Verificar filename
      if (!rec.filename || typeof rec.filename !== 'string') {
        issues.push(`❌ Filename inválido: ${rec.filename}`);
      }
      
      // Verificar size
      if (typeof rec.size !== 'number' || rec.size <= 0) {
        issues.push(`⚠️ Size inválido: ${rec.size}`);
      }
      
      // Verificar created/created_at
      const dateValue = rec.created || rec.created_at;
      if (!dateValue) {
        issues.push('❌ Fecha no disponible');
      } else {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          issues.push(`❌ Fecha inválida: ${dateValue}`);
        }
      }
      
      return {
        index,
        filename: rec.filename,
        size: rec.size,
        date: rec.created || rec.created_at,
        issues,
        isValid: issues.length === 0
      };
    });
    
    // 3. Mostrar resultados
    const valid = analysis.filter(r => r.isValid);
    const invalid = analysis.filter(r => !r.isValid);
    
    console.log(`✅ Grabaciones válidas: ${valid.length}`);
    console.log(`❌ Grabaciones con problemas: ${invalid.length}\n`);
    
    if (invalid.length > 0) {
      console.log('📋 DETALLES DE GRABACIONES CON PROBLEMAS:\n');
      invalid.forEach(rec => {
        console.log(`#${rec.index + 1}: ${rec.filename}`);
        rec.issues.forEach(issue => console.log(`   ${issue}`));
        console.log('');
      });
    }
    
    // 4. Verificar duplicados
    const filenames = recordings.map(r => r.filename);
    const duplicates = filenames.filter((file, index) => filenames.indexOf(file) !== index);
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Filenames duplicados encontrados: ${duplicates.length}`);
      duplicates.forEach(dup => console.log(`   - ${dup}`));
    } else {
      console.log('✅ No hay filenames duplicados');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN FINAL:');
    console.log(`   - Total en VPS: ${recordings.length}`);
    console.log(`   - Válidas: ${valid.length}`);
    console.log(`   - Con problemas: ${invalid.length}`);
    console.log(`   - Duplicados: ${duplicates.length}`);
    
    if (invalid.length > 0) {
      console.log('\n💡 RECOMENDACIÓN: Las grabaciones con "Fecha inválida" son las que');
      console.log('   probablemente NO se muestran en el frontend.');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnoseRecordings();