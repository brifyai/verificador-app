// Wrapper para cargar variables de entorno antes de importar supabase-direct
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno INMEDIATAMENTE antes de cualquier import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Variables de entorno cargadas desde:', path.join(__dirname, '.env'));
console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Presente' : '❌ Vacía');
console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Presente' : '❌ Vacía');

// Ahora importar el módulo que necesita las variables
const { supabaseDirect } = await import('./lib/supabase-direct.js');

// IDs extraídos de los filenames del VPS
const idsFromFilenames = [
  'mijm9xci_rj949ks',
  'mijm9xsi_6nx1sqf'
];

async function debugRadioIds() {
  console.log('\n🔍 DIAGNÓSTICO DE IDs DE RADIOS');
  console.log('='.repeat(60));
  
  console.log('\n📄 IDs extraídos de los filenames:');
  idsFromFilenames.forEach(id => console.log(`  - ${id}`));
  
  try {
    // Obtener todas las radios de Supabase
    console.log('\n📡 Obteniendo todas las radios de Supabase...');
    const allRadios = await supabaseDirect.request('radios?select=id,name&order=id.asc');
    
    console.log(`✅ Se encontraron ${allRadios.length} radios en Supabase:`);
    allRadios.forEach(radio => {
      console.log(`  - ID: "${radio.id}" | Nombre: "${radio.name}"`);
    });
    
    // Verificar cuáles IDs de filenames existen en Supabase
    console.log('\n🔍 Verificando coincidencias:');
    idsFromFilenames.forEach(filenameId => {
      const found = allRadios.find(r => r.id === filenameId);
      if (found) {
        console.log(`  ✅ ${filenameId} -> ENCONTRADO: ${found.name}`);
      } else {
        console.log(`  ❌ ${filenameId} -> NO ENCONTRADO en Supabase`);
        
        // Buscar radios similares
        const similar = allRadios.filter(r => 
          r.id.includes(filenameId.substring(0, 8)) || 
          filenameId.includes(r.id.substring(0, 8))
        );
        if (similar.length > 0) {
          console.log(`     💡 Radios similares encontradas:`);
          similar.forEach(s => console.log(`        - ID: "${s.id}" | Nombre: "${s.name}"`));
        }
      }
    });
    
    // Analizar el formato de los IDs
    console.log('\n📊 Análisis de formato de IDs:');
    console.log('IDs de filenames (del VPS):');
    idsFromFilenames.forEach(id => {
      console.log(`  - ${id} (longitud: ${id.length}, contiene '_': ${id.includes('_')})`);
    });
    
    console.log('\nIDs de Supabase (muestra de los primeros 10):');
    allRadios.slice(0, 10).forEach(radio => {
      console.log(`  - ID: "${radio.id}" | Nombre: "${radio.name}" (longitud: ${radio.id.length}, contiene '_': ${radio.id.includes('_')})`);
    });
    
    // Mostrar algunas radios completas para comparar
    console.log('\n📋 Muestra de radios completas (primeras 5):');
    allRadios.slice(0, 5).forEach(radio => {
      console.log(`  - ID: "${radio.id}"`);
      console.log(`    Nombre: ${radio.name}`);
      console.log(`    URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/radios?id=eq.${radio.id}&select=*`);
    });
    
    // Sugerencias
    console.log('\n💡 SUGERENCIAS:');
    console.log('1. Verifica que el ID en el filename coincide EXACTAMENTE con el ID en Supabase');
    console.log('2. El formato del filename es: radio_{radio_id}_YYYYMMDD_HHMMSS_*.mp3');
    console.log('3. Asegúrate de que {radio_id} en el filename es igual al campo "id" en Supabase');
    console.log('4. Si los IDs no coinciden, necesitas actualizar el código que genera los filenames en la VPS');
    
  } catch (error) {
    console.error('❌ Error obteniendo radios:', error);
    console.error('Detalles del error:', error.message);
  }
}

debugRadioIds().catch(console.error);