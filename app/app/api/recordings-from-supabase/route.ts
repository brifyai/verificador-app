import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

// Función para verificar si un archivo existe en el VPS
async function verificarExistenciaArchivoVPS(filename) {
  try {
    const response = await fetch(`http://213.199.39.147:5000/recordings/${filename}`, {
      method: 'HEAD'
    });
    
    const existe = response.ok && response.status === 200;
    return existe;
  } catch (error) {
    return false;
  }
}

// Función para obtener grabaciones del VPS con información completa
async function getVPSRecordings() {
  try {
    console.log('📡 API: Obteniendo grabaciones reales del VPS...');
    
    const response = await fetch('http://213.199.39.147:5000/api/recordings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error del VPS: ${response.status} ${response.statusText}`);
    }
    
    const vpsData = await response.json();
    console.log(`✅ Grabaciones obtenidas del VPS: ${vpsData.recordings?.length || 0}`);
    
    // Filtrar solo las grabaciones que realmente existen
    const todasGrabaciones = vpsData.recordings || [];
    console.log(`🔍 Verificando existencia de ${todasGrabaciones.length} archivos...`);
    
    const grabacionesReales = [];
    const grabacionesFantasma = [];
    
    // Verificar cada archivo
    for (const recording of todasGrabaciones) {
      const filename = recording.filename;
      const existe = await verificarExistenciaArchivoVPS(filename);
      
      if (existe) {
        grabacionesReales.push(recording);
        console.log(`  ✅ ${filename}: EXISTE`);
      } else {
        grabacionesFantasma.push(recording);
        console.log(`  ❌ ${filename}: NO EXISTE (FANTASMA)`);
      }
      
      // Pausa pequeña para no sobrecargar el VPS
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📊 RESUMEN: ${grabacionesReales.length} reales, ${grabacionesFantasma.length} fantasma`);
    
    if (grabacionesFantasma.length > 0) {
      console.log('🚫 GRABACIONES FANTASMA DETECTADAS Y ELIMINADAS:');
      grabacionesFantasma.forEach(recording => {
        console.log(`   - ${recording.filename}`);
      });
    }
    
    return grabacionesReales;
  } catch (error) {
    console.error('❌ Error obteniendo grabaciones del VPS:', error);
    return [];
  }
}

// Mapeo temporal entre IDs del VPS y IDs de la base de datos
// NOTA: Esto es temporal. La solución permanente es agregar una columna vps_id a la tabla radios
const VPS_TO_DB_RADIO_MAP: { [key: string]: string } = {
  'mijm9xci': '1', // Radio Contagio
  'mijm9xsi': '2', // Radio Pilmaiquen
  // Agregar más mapeos según sea necesario
};

// Función para obtener información completa de una radio desde la base de datos local
async function getRadioInfoFromDatabase(radioId: string) {
  try {
    console.log(`📡 Obteniendo info de radio ${radioId} desde base de datos local...`);
    
    // Mapear ID del VPS a ID de la base de datos
    const dbRadioId = VPS_TO_DB_RADIO_MAP[radioId];
    
    if (!dbRadioId) {
      console.log(`⚠️ Radio ${radioId} no tiene mapeo en la base de datos local`);
      // Retornar datos genéricos como fallback
      return {
        id_radio: radioId,
        name: `Radio ${radioId}`,
        region: 'Región no especificada',
        city: 'Ciudad no especificada',
        platform: 'Plataforma no especificada',
        status: 'active'
      };
    }
    
    console.log(`🔄 Mapeando VPS ID ${radioId} → DB ID ${dbRadioId}`);
    
    // Buscar la radio en la tabla radios por id_radio numérico
    const radioResponse = await supabaseDirect.request(
      `radios?select=id_radio,name,region,description,platform,status&id_radio=eq.${dbRadioId}`
    );
    
    if (radioResponse && radioResponse.length > 0) {
      const radio = radioResponse[0];
      console.log(`✅ Radio ${radioId} encontrada en base de datos:`, radio.name);
      
      return {
        id_radio: radio.id_radio,
        name: radio.name,
        region: radio.region || 'Región no especificada',
        city: radio.description || 'Ciudad no especificada',
        platform: radio.platform || 'Plataforma no especificada',
        status: radio.status || 'active'
      };
    } else {
      console.log(`⚠️ Radio con DB ID ${dbRadioId} no encontrada en base de datos`);
      return {
        id_radio: radioId,
        name: `Radio ${radioId}`,
        region: 'Región no especificada',
        city: 'Ciudad no especificada',
        platform: 'Plataforma no especificada',
        status: 'active'
      };
    }
  } catch (error) {
    console.error(`❌ Error obteniendo info de radio ${radioId} desde base de datos:`, error);
    return {
      id_radio: radioId,
      name: `Radio ${radioId}`,
      region: 'Región no especificada',
      city: 'Ciudad no especificada',
      platform: 'Plataforma no especificada',
      status: 'active'
    };
  }
}

// Lista de archivos problemáticos a excluir de la sincronización
// TEMPORALMENTE DESHABILITADO: Permitir que todas las grabaciones se muestren
const PROBLEMATIC_FILES: string[] = [
  // 'radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
  // 'radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
  // 'radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
];

// Función para sincronizar grabaciones del VPS a Supabase
async function syncVPSRecordingsToSupabase(vpsRecordings: any[]) {
  if (!vpsRecordings || vpsRecordings.length === 0) {
    console.log('⚠️ No hay grabaciones del VPS para sincronizar');
    return [];
  }
  
  // Filtrar grabaciones problemáticas
  const filteredRecordings = vpsRecordings.filter(recording => {
    const filename = recording.filename || '';
    const isProblematic = PROBLEMATIC_FILES.includes(filename);
    if (isProblematic) {
      console.log(`🚫 Excluyendo grabación problemática: ${filename}`);
    }
    return !isProblematic;
  });
  
  console.log(`📋 Sincronizando ${filteredRecordings.length} grabaciones del VPS a Supabase...`);
  console.log(`🗑️ ${vpsRecordings.length - filteredRecordings.length} grabaciones problemáticas excluidas`);
  
  const syncedRecordings = [];
  
  for (const recording of filteredRecordings) {
    try {
      // ESTRATEGIA ÓPTIMA: Enriquecer con tabla radios
      // El VPS solo necesita enviar radio_id y datos técnicos
      
      // Extraer radio_id del filename si no viene directamente
      let radioId = recording.radio_id;
      if (!radioId && recording.filename) {
        // Extraer ID del filename: radio_ID_...
        const match = recording.filename.match(/^radio_([^_]+)_/);
        if (match && match[1]) {
          radioId = match[1];
          console.log(`📡 Extraído radio_id del filename: ${radioId} de ${recording.filename}`);
        }
      }
      
      // Verificar que tenemos radio_id
      if (!radioId) {
        console.log(`⚠️ Grabación sin radio_id del VPS: ${recording.filename}`);
        continue;
      }
      
      console.log(`📋 Procesando grabación: ${recording.filename}`);
      
      // ENRIQUECER con datos de la tabla radios
      let enrichedData = null;
      try {
        // Buscar la radio por vps_id (el ID del VPS)
        console.log(`🔍 Buscando radio con vps_id: "${radioId}"`);
        
        const radioResponse = await supabaseDirect.request(
          `radios?select=id,name,region,description,platform,status&vps_id=eq.${encodeURIComponent(radioId)}`
        );
        
        console.log(`🔍 Respuesta de búsqueda para vps_id "${radioId}":`, radioResponse);
        
        if (radioResponse && radioResponse.length > 0) {
          const radio = radioResponse[0];
          enrichedData = {
            radio_id: radio.id, // ID numérico para la clave foránea
            radio_name: radio.name,
            radio_region: radio.region || 'Región no especificada',
            radio_city: radio.description || 'Ciudad no especificada',
            radio_programadora: radio.platform || 'Plataforma no especificada'
          };
          console.log(`✅ Radio encontrada por vps_id ${radioId}: ${radio.name} (ID: ${radio.id})`);
        } else {
          console.log(`⚠️ Radio con vps_id ${radioId} no encontrada en tabla radios. Omitiendo grabación.`);
          continue; // Saltar esta grabación porque no hay correspondencia
        }
      } catch (error) {
        console.log(`⚠️ Error obteniendo datos de radio, usando genéricos:`, error instanceof Error ? error.message : String(error));
        enrichedData = {
          radio_id: radioId,
          radio_name: `Radio ${radioId}`,
          radio_region: 'Región no especificada',
          radio_city: 'Ciudad no especificada'
        };
      }
      
      // Preparar datos para Supabase con ENRIQUECIMIENTO
      const recordingData = {
        radio_id: enrichedData.radio_id,
        filename: recording.filename,
        file_path: recording.file_path || recording.path || recording.filename,
        file_size: recording.file_size || recording.size || 0,
        duration_seconds: recording.duration_seconds || 0,
        recorded_at: recording.recorded_at || recording.created || new Date().toISOString(),
        metadata: {
          source: 'vps_enriched',
          radio_table_sync: new Date().toISOString(),
          original_radio_id: radioId,
          enrichment_source: enrichedData.radio_name.startsWith('Radio ') ? 'generic' : 'radio_table'
        }
      };
      
      // Verificar si ya existe esta grabación
      const existingRecording = await supabaseDirect.request(
        `recordings?select=id&filename=eq.${encodeURIComponent(recording.filename)}`
      );
      
      if (existingRecording && existingRecording.length > 0) {
        console.log(`   ✅ Grabación ya existe: ${recording.filename}`);
        
        // Actualizar la grabación existente con los datos COMPLETOS del VPS
        try {
          await supabaseDirect.request(`recordings?id=eq.${existingRecording[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              radio_id: recordingData.radio_id,
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
          console.log(`   ✅ Grabación actualizada con datos COMPLETOS del VPS: ${recording.filename}`);
          console.log(`   ✅ Radio: ${enrichedData.radio_name} (${recordingData.radio_id})`);
        } catch (updateError) {
          console.log(`   ⚠️ No se pudo actualizar grabación existente: ${recording.filename}`);
        }
        
        syncedRecordings.push({
          ...recordingData,
          id: existingRecording[0].id,
          exists: true
        });
      } else {
        // Crear nueva grabación con datos COMPLETOS del VPS
        const newRecording = await supabaseDirect.request('recordings', {
          method: 'POST',
          body: JSON.stringify(recordingData)
        });
        
        if (newRecording) {
          console.log(`   ✅ Grabación sincronizada con datos COMPLETOS del VPS: ${recording.filename}`);
          console.log(`   ✅ Radio: ${enrichedData.radio_name} (${recordingData.radio_id})`);
          syncedRecordings.push(newRecording);
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error sincronizando grabación ${recording.filename}:`, error);
      // Continuar con la siguiente grabación
    }
  }
  
  return syncedRecordings;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API: Obteniendo grabaciones directamente del VPS...');
    
    // Obtener grabaciones reales del VPS
    
    // Obtener grabaciones reales del VPS
    const vpsRecordings = await getVPSRecordings();
    
    if (!vpsRecordings || vpsRecordings.length === 0) {
      console.log('⚠️ No hay grabaciones del VPS disponibles');
      return NextResponse.json({
        status: 'success',
        count: 0,
        recordings: [],
        source: 'vps_direct'
      });
    }
    
    // Filtrar grabaciones problemáticas (si las hay)
    const filteredRecordings = vpsRecordings.filter(recording => {
      const filename = recording.filename || '';
      const isProblematic = PROBLEMATIC_FILES.includes(filename);
      if (isProblematic) {
        console.log(`🚫 Excluyendo grabación problemática: ${filename}`);
      }
      return !isProblematic;
    });
    
    console.log(`📋 Procesando ${filteredRecordings.length} grabaciones del VPS`);
    
    // Enriquecer cada grabación con información de la radio desde el VPS
    const enrichedRecordings = [];
    
    for (const recording of filteredRecordings) {
      try {
        // Extraer radio_id del filename si no viene directamente
        let radioId = recording.radio_id;
        if (!radioId && recording.filename) {
          const match = recording.filename.match(/^radio_([^_]+)_/);
          if (match && match[1]) {
            radioId = match[1];
            console.log(`📡 Extraído radio_id del filename: ${radioId} de ${recording.filename}`);
          }
        }
        
        if (!radioId) {
          console.log(`⚠️ Grabación sin radio_id del VPS: ${recording.filename}`);
          continue;
        }
        
        // Obtener información de la radio desde la base de datos local
        const radioInfo = await getRadioInfoFromDatabase(radioId);
        
        // Construir objeto enriquecido similar al que espera el frontend
        const enriched = {
          id: recording.filename, // Usar el nombre de archivo como ID temporal
          filename: recording.filename,
          size: recording.file_size || recording.size || 0,
          created_at: recording.recorded_at || recording.created || new Date().toISOString(),
          radio_id: radioId,
          radio_name: radioInfo?.name || `Radio ${radioId}`,
          radio_region: radioInfo?.region || 'Región no especificada',
          radio_city: radioInfo?.city || 'Ciudad no especificada',
          duration_seconds: recording.duration_seconds || 0,
          file_path: recording.file_path || recording.filename,
          recorded_at: recording.recorded_at || recording.created || new Date().toISOString(),
          vps_created_at: recording.created || recording.recorded_at,
          download_url: `http://213.199.39.147:5000/recordings/${recording.filename}`,
          metadata: {
            source: 'vps_direct',
            original_radio_id: radioId,
            radio: radioInfo || null
          }
        };
        
        enrichedRecordings.push(enriched);
        console.log(`✅ Grabación enriquecida: ${recording.filename}`);
      } catch (error) {
        console.error(`❌ Error procesando grabación ${recording.filename}:`, error);
        // Continuar con la siguiente
      }
    }
    
    // Aplicar paginación básica si se solicita
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const radioIdFilter = searchParams.get('radioId');
    
    let filtered = enrichedRecordings;
    if (radioIdFilter) {
      filtered = filtered.filter(rec => rec.radio_id === radioIdFilter);
    }
    
    const paginated = filtered.slice(offset, offset + limit);
    
    return NextResponse.json({
      status: 'success',
      count: filtered.length,
      recordings: paginated,
      source: 'vps_direct'
    });
    
  } catch (error) {
    console.error('❌ Error en API /api/recordings-from-supabase:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        recordings: []
      },
      { status: 500 }
    );
  }
}