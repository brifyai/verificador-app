// Script para verificar datos de grabaciones directamente desde Supabase
const { createClient } = require('@supabase/supabase-js');

// Usar las credenciales del archivo .env
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Por favor, verifica que .env.local contenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecordingsData() {
  console.log('🔍 Verificando datos de grabaciones en Supabase...\n');
  console.log('📡 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');
  console.log('');
  
  try {
    // Obtener grabaciones con sus radios asociadas
    const { data: recordings, error: recordingsError } = await supabase
      .from('recordings')
      .select(`
        *,
        radios!inner (
          id,
          name,
          region,
          metadata
        )
      `)
      .order('recorded_at', { ascending: false })
      .limit(10);
    
    if (recordingsError) {
      throw new Error(`Error obteniendo grabaciones: ${recordingsError.message}`);
    }
    
    console.log(`📊 Se encontraron ${recordings?.length || 0} grabaciones:\n`);
    
    if (recordings && recordings.length > 0) {
      recordings.forEach((recording, index) => {
        console.log(`${index + 1}. ${recording.filename}`);
        console.log(`   - Radio ID: ${recording.radio_id}`);
        console.log(`   - Radio Name en grabación: "${recording.radio_name}"`);
        
        if (recording.radios && recording.radios.length > 0) {
          const radio = recording.radios[0];
          console.log(`   - Nombre real de la radio: "${radio.name}"`);
          console.log(`   - Región: ${radio.region}`);
          console.log(`   - Ciudad: ${radio.metadata?.city || 'No especificada'}`);
          
          // Verificar si el nombre está correctamente enriquecido
          const isCorrectlyEnriched = recording.radio_name === radio.name;
          if (isCorrectlyEnriched) {
            console.log(`   - ✅ Nombre correctamente enriquecido`);
          } else {
            console.log(`   - ❌ PROBLEMA: El nombre no coincide con el real`);
            console.log(`   - 🔧 Solución: Actualizar radio_name a "${radio.name}"`);
          }
        } else {
          console.log(`   - ⚠️  Radio no encontrada en base de datos`);
          console.log(`   - 📄 Nombre mostrado: "${recording.radio_name}"`);
        }
        console.log('');
      });
      
      // Estadísticas
      const withRadioData = recordings.filter(rec => rec.radios && rec.radios.length > 0);
      const correctlyEnriched = withRadioData.filter(rec => 
        rec.radio_name === rec.radios[0].name
      );
      const genericNames = recordings.filter(rec => 
        rec.radio_name === `Radio ${rec.radio_id}` || 
        rec.radio_name.includes(rec.radio_id)
      );
      
      console.log('📈 ESTADÍSTICAS:');
      console.log(`- Total grabaciones: ${recordings.length}`);
      console.log(`- Con datos de radio: ${withRadioData.length}`);
      console.log(`- Nombres correctamente enriquecidos: ${correctlyEnriched.length}`);
      console.log(`- Nombres genéricos (Radio ID): ${genericNames.length}`);
      
      if (genericNames.length > 0) {
        console.log('\n❌ PROBLEMA DETECTADO:');
        console.log(`${genericNames.length} grabaciones muestran nombres genéricos en lugar de los nombres reales.`);
        console.log('Esto explica por qué el usuario ve "radio mijm9xci" en la interfaz.');
      }
      
    } else {
      console.log('⚠️ No se encontraron grabaciones en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
    console.log('\n💡 Sugerencia: Verifica la conexión con Supabase y los permisos de la tabla.');
  }
}

// Ejecutar verificación
checkRecordingsData();