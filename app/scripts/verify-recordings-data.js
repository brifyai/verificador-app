const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRecordingsData() {
  console.log('🔍 Verificando datos de grabaciones en Supabase...\n');
  
  try {
    // Obtener todas las grabaciones
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(10);
    
    if (recordingsError) {
      throw new Error(`Error obteniendo grabaciones: ${recordingsError.message}`);
    }
    
    console.log(`📊 Se encontraron ${recordings?.length || 0} grabaciones:\n`);
    
    if (recordings && recordings.length > 0) {
      for (const recording of recordings) {
        console.log(`📻 ${recording.filename}`);
        console.log(`   - Radio ID: ${recording.radio_id}`);
        console.log(`   - Radio Name: "${recording.radio_name}"`);
        console.log(`   - Radio Region: "${recording.radio_region}"`);
        console.log(`   - Radio City: "${recording.radio_city}"`);
        console.log(`   - File Size: ${recording.file_size} bytes`);
        console.log(`   - Recorded At: ${recording.recorded_at}`);
        
        // Verificar si el nombre está enriquecido o es genérico
        const isGenericName = recording.radio_name === `Radio ${recording.radio_id}` ||
                             recording.radio_name.includes(recording.radio_id);
        
        if (isGenericName) {
          console.log(`   - ❌ PROBLEMA: Nombre genérico detectado`);
          console.log(`   - 🔍 Debería mostrar el nombre real, no "Radio ${recording.radio_id}"`);
        } else {
          console.log(`   - ✅ Nombre enriquecido correctamente`);
        }
        console.log('');
      }
      
      // Resumen
      const genericCount = recordings.filter(rec => 
        rec.radio_name === `Radio ${rec.radio_id}` || 
        rec.radio_name.includes(rec.radio_id)
      ).length;
      
      console.log('📈 RESUMEN:');
      console.log(`- Total grabaciones: ${recordings.length}`);
      console.log(`- Con nombres genéricos: ${genericCount}`);
      console.log(`- Con nombres enriquecidos: ${recordings.length - genericCount}`);
      
      if (genericCount > 0) {
        console.log('\n❌ PROBLEMA IDENTIFICADO:');
        console.log('Las grabaciones están mostrando nombres genéricos en lugar de los nombres reales de las radios.');
        console.log('Esto explica por qué el usuario ve "radio mijm9xci" en la interfaz.');
      }
    } else {
      console.log('⚠️ No se encontraron grabaciones en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
    console.log('\n💡 Sugerencia: Verifica que las variables de entorno de Supabase estén configuradas correctamente.');
  }
}

// Ejecutar verificación
verifyRecordingsData();