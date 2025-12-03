import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

// Función para extraer radio_id desde el filename
// Formato: radio_{radio_id}_YYYYMMDD_HHMMSS_*.mp3
function extractRadioIdFromFilename(filename: string): string | null {
  try {
    // Ejemplo: radio_mijm9xci_rj949ks_20251202_004618_*.mp3
    const parts = filename.split('_');
    if (parts.length < 4) {
      console.warn(`⚠️ Formato de filename inválido: ${filename}`);
      return null;
    }
    
    // El radio_id está en la posición 1 (después de "radio")
    // Pero algunos IDs contienen guiones bajos, así que necesitamos reconstruirlo
    const idParts = [];
    let i = 1;
    
    // Continuar agregando partes hasta encontrar una que parezca fecha (8 dígitos)
    while (i < parts.length && !/^\d{8}$/.test(parts[i])) {
      idParts.push(parts[i]);
      i++;
    }
    
    // Reconstruir el ID (sin el prefijo "radio")
    const radioIdWithoutPrefix = idParts.join('_');
    
    // Los IDs en Supabase tienen el prefijo "radio_", así que lo agregamos
    const radioId = `radio_${radioIdWithoutPrefix}`;
    
    console.log(`📄 Filename: ${filename} -> Radio ID: ${radioId}`);
    return radioId;
  } catch (error) {
    console.error(`❌ Error extrayendo radio_id de ${filename}:`, error);
    return null;
  }
}

// Función para extraer radio_id desde el path
// Formato: .../recordings/YYYY-MM-DD/HH/radio_{radio_id}_*.mp3
function extractRadioIdFromPath(path: string): string | null {
  const match = path.match(/radio_([^_]+_[^_]+)_\d{8}_\d{6}_/);
  return match ? match[1] : null;
}

// Función para obtener datos de una radio desde Supabase
async function getRadioData(radioId: string) {
  try {
    console.log(`🔍 Buscando datos para radio_id: ${radioId}`);
    
    // El ID ya viene con el prefijo "radio_" desde extractRadioIdFromFilename
    const data = await supabaseDirect.request(`radios?select=id,name,region,metadata&id=eq.${radioId}`);
    
    if (!data || data.length === 0) {
      console.warn(`⚠️ No se encontró radio con id: ${radioId}`);
      return null;
    }
    
    console.log(`✅ Datos encontrados para ${radioId}:`, data[0]);
    return data[0];
  } catch (error) {
    console.error(`❌ Error inesperado obteniendo radio ${radioId}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Enriched: Obteniendo grabaciones desde VPS...');
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const radioId = searchParams.get('radioId');
    
    // Construir URL con parámetros
    let vpsUrl = `${VPS_API_URL}/recordings`;
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (radioId) params.append('radioId', radioId);
    
    if (params.toString()) {
      vpsUrl += `?${params.toString()}`;
    }
    
    console.log(`📡 URL VPS: ${vpsUrl}`);
    
    // Obtener datos del VPS
    const response = await fetch(vpsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error VPS API: ${response.status} - ${errorText}`);
      throw new Error(`Error al obtener grabaciones: ${response.status}`);
    }
    
    const vpsData = await response.json();
    console.log(`✅ Grabaciones obtenidas del VPS: ${vpsData.recordings?.length || 0} archivos`);
    
    // Enriquecer cada grabación con datos de la radio
    const enrichedRecordings = [];
    const radioCache = new Map(); // Cache para evitar múltiples llamadas a Supabase
    
    if (vpsData.recordings && Array.isArray(vpsData.recordings)) {
      for (const recording of vpsData.recordings) {
        // Extraer radio_id desde filename o path
        const radioId = extractRadioIdFromFilename(recording.filename) || 
                       extractRadioIdFromPath(recording.path);
        
        if (!radioId) {
          console.warn(`⚠️ No se pudo extraer radio_id de: ${recording.filename}`);
          // Usar datos básicos sin enriquecer
          enrichedRecordings.push({
            filename: recording.filename,
            size: recording.size,
            created_at: recording.created || recording.created_at,
            path: recording.path,
            radio_id: 'unknown',
            radio_name: 'Radio Desconocida',
            radio_region: 'Región Desconocida',
            radio_city: 'Ciudad Desconocida',
            radio_programadora: 'Programadora Desconocida',
            display_name: recording.filename,
          });
          continue;
        }
        
        // Verificar si ya tenemos los datos en caché
        let radioData = radioCache.get(radioId);
        
        if (!radioData) {
          // Obtener datos de Supabase
          radioData = await getRadioData(radioId);
          if (radioData) {
            radioCache.set(radioId, radioData);
          }
        }
        
        // Crear grabación enriquecida
        // Extraer ciudad desde metadata si existe
        const metadata = radioData?.metadata || {};
        const city = metadata.city || 'Ciudad no especificada';
        
        const enrichedRecording = {
          filename: recording.filename,
          size: recording.size,
          created_at: recording.created || recording.created_at,
          path: recording.path,
          radio_id: radioId,
          radio_name: radioData?.name || `Radio ${radioId}`,
          radio_region: radioData?.region || 'Región no especificada',
          radio_city: city,
          display_name: radioData?.name ? `${radioData.name} - ${new Date(recording.created).toLocaleDateString()}` : recording.filename,
        };
        
        enrichedRecordings.push(enrichedRecording);
      }
      
      console.log(`✅ Grabaciones enriquecidas: ${enrichedRecordings.length}`);
      console.log(`📊 Caché de radios utilizado: ${radioCache.size} radios únicas`);
    }
    
    // Formatear respuesta para el frontend
    return NextResponse.json({
      status: 'success',
      count: enrichedRecordings.length,
      recordings: enrichedRecordings,
      source: 'enriched-api'
    });
    
  } catch (error) {
    console.error('❌ Error en API enriched /api/recordings-enriched:', error);
    
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