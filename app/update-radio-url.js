const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Las variables de entorno de Supabase no están configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateRadioUrl(radioId, newUrl) {
  try {
    console.log(`🔄 Actualizando URL de radio ${radioId} a: ${newUrl}`);
    
    // Actualizar la URL del stream
    const { data, error } = await supabase
      .from('radios')
      .update({ 
        stream_url: newUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', radioId)
      .select();

    if (error) {
      console.error('❌ Error al actualizar la URL:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ URL actualizada exitosamente');
      console.log('📻 Datos de la radio actualizada:', {
        id: data[0].id,
        name: data[0].name,
        streamUrl: data[0].stream_url,
        region: data[0].region,
        city: data[0].city
      });
      return true;
    } else {
      console.log('⚠️  No se encontró la radio con el ID especificado');
      return false;
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

// Ejecutar si se proporcionan argumentos
if (process.argv.length >= 4) {
  const radioId = process.argv[2];
  const newUrl = process.argv[3];
  
  updateRadioUrl(radioId, newUrl).then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  console.log('📋 Uso: node update-radio-url.js <radio-id> <nueva-url>');
  console.log('📋 Ejemplo: node update-radio-url.js radio_mijm9z54_lbyyh3k "https://streaming.chiloestreaming.com:10976/"');
}