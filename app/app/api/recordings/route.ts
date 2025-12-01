import { NextRequest, NextResponse } from 'next/server';

const VPS_API_BASE = 'http://213.199.39.147:5000/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener grabaciones del VPS
    const response = await fetch(`${VPS_API_BASE}/recordings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const vpsData = await response.json();

    // 2. Si hay grabaciones, enriquecerlas con metadata de radios
    if (vpsData.status === 'success' && vpsData.recordings && vpsData.recordings.length > 0) {
      
      // Obtener lista de radios desde Supabase para enriquecer metadata
      let radios: any[] = [];
      try {
        console.log('🔍 Intentando obtener radios de Supabase...');
        console.log('🔍 SUPABASE_URL:', SUPABASE_URL);
        console.log('🔍 SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Definido' : '❌ No definido');
        
        // La columna city no existe directamente, está dentro de metadata
        const radiosUrl = `${SUPABASE_URL}/rest/v1/radios?select=id,name,region,metadata`;
        console.log('🔍 URL de consulta:', radiosUrl);
        
        const radiosResponse = await fetch(radiosUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔍 Respuesta de Supabase - Status:', radiosResponse.status);
        console.log('🔍 Respuesta de Supabase - OK:', radiosResponse.ok);
        
        if (radiosResponse.ok) {
          radios = await radiosResponse.json();
          console.log('✅ Radios obtenidas exitosamente:', radios.length);
          if (radios.length > 0) {
            console.log('📻 Primera radio (muestra):', JSON.stringify(radios[0], null, 2));
          }
        } else {
          const errorText = await radiosResponse.text();
          console.error('❌ Error en respuesta de Supabase:', radiosResponse.status, errorText);
        }
      } catch (radioError) {
        console.error('💥 Error crítico obteniendo radios:', radioError);
      }

      // Crear mapa de radio_id -> metadata
      console.log('📻 Radios obtenidas de Supabase:', radios.length);
      console.log('📻 Muestra de radios:', radios.slice(0, 3));
      
      const radioMap = new Map(radios.map(r => {
        console.log(`📻 Mapeando radio: id="${r.id}", name="${r.name}"`);
        // La ciudad está dentro de metadata.city
        const city = r.metadata?.city || 'N/A';
        const programadora = r.metadata?.programadora || 'N/A';
        console.log(`📻 Datos extraídos - region: "${r.region}", city: "${city}", programadora: "${programadora}"`);
        
        return [r.id, {
          name: r.name,
          region: r.region,
          city: city,
          programadora: programadora
        }];
      }));
      
      console.log('📻 Mapa de radios creado:', radioMap.size, 'entradas');

      // Enriquecer grabaciones con metadata
      const enrichedRecordings = vpsData.recordings.map((recording: any) => {
        // Extraer radio_id del filename (formato: radio-1_... o radio_mijm9xdj_gb68gow_...)
        const filenameParts = recording.filename.split('_');
        
        // Detectar el formato del radio ID
        let radioIdFromFile, radioNumber;
        
        if (filenameParts[0] === 'radio' && filenameParts[1] && filenameParts[1].match(/^\d+$/)) {
          // Formato antiguo: radio-1_20251129_...
          radioIdFromFile = `${filenameParts[0]}-${filenameParts[1]}`;
          radioNumber = filenameParts[1];
        } else if (filenameParts[0] === 'radio' && filenameParts[1] && filenameParts[1].match(/^mijm9/)) {
          // Formato nuevo: radio_mijm9xdj_gb68gow_20251129_...
          // Buscar hasta donde termina el ID de radio (antes del timestamp YYYYMMDD)
          const timestampIndex = filenameParts.findIndex((part: string) => part.match(/^\d{8}$/));
          if (timestampIndex > 0) {
            radioIdFromFile = filenameParts.slice(0, timestampIndex).join('_');
          } else {
            // Fallback: tomar las primeras 3 partes como máximo
            radioIdFromFile = filenameParts.slice(0, 3).join('_');
          }
          radioNumber = null; // No es un formato numérico
        } else {
          // Fallback para otros formatos
          radioIdFromFile = filenameParts[0];
          radioNumber = null;
        }
        
        console.log(`🔍 Procesando archivo: ${recording.filename}`);
        console.log(`🔍 radioIdFromFile extraído: "${radioIdFromFile}"`);
        console.log(`🔍 radioNumber extraído: ${radioNumber}`);
        
        let radio = null;
        
        // 1. Intentar buscar por ID numérico exacto (formato: "1")
        if (radioNumber) {
          radio = radioMap.get(`radio-${radioNumber}`) || radioMap.get(radioNumber);
          console.log(`🔍 Buscando por radioNumber "${radioNumber}" o "radio-${radioNumber}": ${radio ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
        }
        
        // 2. Si no se encuentra, buscar por ID exacto como fallback
        if (!radio) {
          radio = radioMap.get(radioIdFromFile);
          console.log(`🔍 Buscando por radioIdFromFile exacto "${radioIdFromFile}": ${radio ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
        }
        
        // 3. Si aún no se encuentra, buscar por nombre que contenga el número de radio
        if (!radio && radioNumber) {
          const matchedRadio = radios.find((r: any) => {
            const match = r.name && r.name.toLowerCase().includes(radioNumber.toLowerCase());
            console.log(`🔍 Comparando "${r.name}" con "${radioNumber}": ${match ? 'MATCH' : 'NO MATCH'}`);
            return match;
          });
          if (matchedRadio) {
            radio = {
              name: matchedRadio.name,
              region: matchedRadio.region,
              city: matchedRadio.city,
              programadora: matchedRadio.programadora
            };
            console.log(`🔍 Radio encontrada por nombre: ${radio.name}`);
          }
        }
        
        // 4. Si aún no se encuentra, buscar por cualquier coincidencia parcial
        if (!radio) {
          const searchTerm = radioNumber || radioIdFromFile.replace('radio-', '').toLowerCase();
          const matchedRadio = radios.find((r: any) => {
            const match = r.name && r.name.toLowerCase().includes(searchTerm);
            console.log(`🔍 Comparando "${r.name}" con "${searchTerm}": ${match ? 'MATCH' : 'NO MATCH'}`);
            return match;
          });
          if (matchedRadio) {
            radio = {
              name: matchedRadio.name,
              region: matchedRadio.region,
              city: matchedRadio.city,
              programadora: matchedRadio.programadora
            };
            console.log(`🔍 Radio encontrada por búsqueda parcial: ${radio.name}`);
          }
        }
        
        // Fallback si no se encuentra la radio
        if (!radio) {
          console.log(`❌ No se encontró radio para: ${radioIdFromFile}, usando fallback N/A`);
          radio = {
            name: radioIdFromFile,
            region: 'N/A',
            city: 'N/A',
            programadora: 'N/A'
          };
        } else {
          console.log(`✅ Radio encontrada: ${radio.name} (${radio.region}, ${radio.city})`);
        }

        // Crear nombre legible para display
        const timestamp = recording.created_at || recording.created;
        const displayName = `${radio.name}_${radio.region}_${radio.city}_${timestamp}.mp3`
          .replace(/[^a-zA-Z0-9_\-./]/g, '_') // Sanitizar nombre de archivo
          .replace(/\s+/g, '_');

        return {
          filename: recording.filename,
          size: recording.size,
          created_at: recording.created_at || recording.created,
          path: recording.path,
          created: recording.created || recording.created_at,
          // Metadata enriquecida
          radio_id: radioIdFromFile,
          radio_name: radio.name,
          radio_region: radio.region,
          radio_city: radio.city,
          radio_programadora: radio.programadora,
          // Nombre legible para mostrar al usuario
          display_name: displayName,
          // Ordenación clave
          sort_key: `${radio.name}_${timestamp}`
        };
      });

      // Ordenar por radio y fecha (más recientes primero)
      const sortedRecordings = enrichedRecordings.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descendente
      });

      return NextResponse.json({
        status: 'success',
        count: sortedRecordings.length,
        recordings: sortedRecordings,
      });
    }

    // Si no hay grabaciones, devolver array vacío
    return NextResponse.json({
      status: 'success',
      count: 0,
      recordings: [],
    });

  } catch (error) {
    console.error('Error obteniendo grabaciones del VPS:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Error de conexión con el VPS',
        count: 0,
        recordings: [],
      },
      { status: 500 }
    );
  }
}