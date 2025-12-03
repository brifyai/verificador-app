import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

// Función para extraer radio_id del filename
function extractRadioId(filename: string): string {
  const match = filename.match(/^radio_([^_]+)_/);
  return match ? match[1] : 'unknown';
}

// Función para extraer fecha del filename
function extractDate(filename: string): string {
  const match = filename.match(/_(\d{8})_\d{6}_/);
  if (match) {
    const dateStr = match[1]; // YYYYMMDD
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return 'unknown';
}

// Función para obtener información de radio desde Supabase
async function getRadioInfoFromSupabase(radioId: string) {
  try {
    console.log(`🔍 Buscando radio ${radioId} en Supabase...`);
    
    // Buscar por vps_id primero, luego por id
    const radioResponse = await supabaseDirect.request(
      `radios?select=id,name,region,description,platform,status,vps_id&id=eq.${encodeURIComponent(radioId)}`
    );
    
    if (radioResponse && radioResponse.length > 0) {
      const radio = radioResponse[0];
      console.log(`✅ Radio encontrada por id: ${radio.name} (${radio.id})`);
      return {
        id: radio.id,
        name: radio.name,
        region: radio.region || 'Región no especificada',
        description: radio.description || 'Ciudad no especificada',
        platform: radio.platform || 'Plataforma no especificada'
      };
    }
    
    // Si no se encuentra por id, buscar por vps_id
    const vpsRadioResponse = await supabaseDirect.request(
      `radios?select=id,name,region,description,platform,status,vps_id&vps_id=eq.${encodeURIComponent(radioId)}`
    );
    
    if (vpsRadioResponse && vpsRadioResponse.length > 0) {
      const radio = vpsRadioResponse[0];
      console.log(`✅ Radio encontrada por vps_id: ${radio.name} (${radio.id})`);
      return {
        id: radio.id,
        name: radio.name,
        region: radio.region || 'Región no especificada',
        description: radio.description || 'Ciudad no especificada',
        platform: radio.platform || 'Plataforma no especificada'
      };
    }
    
    console.log(`⚠️ Radio ${radioId} no encontrada en Supabase`);
    return null;
  } catch (error) {
    console.error(`❌ Error obteniendo información de radio ${radioId}:`, error);
    return null;
  }
}

// Función para procesar y guardar una grabación
async function processAndSaveRecording(recording: any) {
  try {
    // Extraer radio_id del filename si no viene directamente
    let radioId = recording.radio_id;
    if (!radioId && recording.filename) {
      radioId = extractRadioId(recording.filename);
      console.log(`📡 Extraído radio_id del filename: ${radioId} de ${recording.filename}`);
    }
    
    if (!radioId) {
      console.log(`⚠️ Grabación sin radio_id: ${recording.filename}`);
      return { success: false, error: 'Sin radio_id' };
    }
    
    // Obtener información de la radio
    const radioInfo = await getRadioInfoFromSupabase(radioId);
    if (!radioInfo) {
      console.log(`⚠️ Radio ${radioId} no encontrada, omitiendo grabación: ${recording.filename}`);
      return { success: false, error: 'Radio no encontrada' };
    }
    
    // Extraer fecha del filename para la nueva estructura
    const date = extractDate(recording.filename);
    const newFilePath = date !== 'unknown' 
      ? `/recordings/${date}/${radioId}/${recording.filename}`
      : recording.file_path || recording.filename;
    
    // Preparar datos para guardar
    const recordingData = {
      radio_id: radioInfo.id, // ID numérico para la clave foránea
      radio_name: radioInfo.name,
      radio_region: radioInfo.region,
      radio_city: radioInfo.description,
      filename: recording.filename,
      file_path: recording.file_path || `http://213.199.39.147:5000${newFilePath}`,
      file_size: recording.file_size || recording.size || 0,
      duration_seconds: recording.duration_seconds || 0,
      recorded_at: recording.recorded_at || recording.created || new Date().toISOString(),
      metadata: {
        source: 'vps_organized',
        original_radio_id: radioId,
        radio_table_sync: new Date().toISOString(),
        enrichment_source: 'radio_table',
        organization_date: new Date().toISOString(),
        ...recording.metadata
      }
    };
    
    // Verificar si ya existe esta grabación
    const existingRecording = await supabaseDirect.request(
      `recordings?select=id&filename=eq.${encodeURIComponent(recording.filename)}`
    );
    
    if (existingRecording && existingRecording.length > 0) {
      console.log(`   ✅ Grabación ya existe: ${recording.filename}`);
      
      // Actualizar la grabación existente
      try {
        await supabaseDirect.request(`recordings?id=eq.${existingRecording[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            radio_id: recordingData.radio_id,
            radio_name: recordingData.radio_name,
            radio_region: recordingData.radio_region,
            radio_city: recordingData.radio_city,
            file_path: recordingData.file_path,
            file_size: recordingData.file_size,
            duration_seconds: recordingData.duration_seconds,
            recorded_at: recordingData.recorded_at,
            metadata: {
              ...recordingData.metadata,
              updated_at: new Date().toISOString(),
              last_sync: new Date().toISOString()
            }
          })
        });
        console.log(`   ✅ Grabación actualizada: ${recording.filename}`);
        return { success: true, id: existingRecording[0].id, action: 'updated' };
      } catch (updateError) {
        console.log(`   ⚠️ No se pudo actualizar grabación existente: ${recording.filename}`);
        return { success: false, error: 'Error actualizando' };
      }
    } else {
      // Crear nueva grabación
      try {
        const newRecording = await supabaseDirect.request('recordings', {
          method: 'POST',
          body: JSON.stringify(recordingData)
        });
        
        if (newRecording) {
          console.log(`   ✅ Nueva grabación guardada: ${recording.filename}`);
          return { success: true, id: newRecording.id, action: 'created' };
        } else {
          return { success: false, error: 'Error creando grabación' };
        }
      } catch (createError) {
        console.log(`   ❌ Error creando grabación: ${recording.filename}`);
        return { success: false, error: 'Error creando' };
      }
    }
    
  } catch (error) {
    console.error(`❌ Error procesando grabación ${recording.filename}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📡 API: Guardando grabaciones en Supabase...');
    
    const body = await request.json();
    const recordings = body.recordings;
    
    if (!recordings || !Array.isArray(recordings)) {
      return NextResponse.json({
        status: 'error',
        message: 'Se requiere un array de grabaciones en el campo "recordings"'
      }, { status: 400 });
    }
    
    console.log(`📋 Procesando ${recordings.length} grabaciones...`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada grabación
    for (const recording of recordings) {
      const result = await processAndSaveRecording(recording);
      results.push({
        filename: recording.filename,
        ...result
      });
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log(`✅ Procesamiento completado: ${successCount} exitosas, ${errorCount} errores`);
    
    return NextResponse.json({
      status: 'success',
      message: 'Grabaciones procesadas',
      summary: {
        total: recordings.length,
        successful: successCount,
        errors: errorCount
      },
      results: results
    });
    
  } catch (error) {
    console.error('❌ Error en API /api/recordings-save:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}