import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

const VPS_API_URL = process.env.VPS_API_URL || 'http://213.199.39.147:5000/api';

// Función para extraer fecha/hora exacta del filename
// Formato: radio_{id}_YYYYMMDD_HHMMSS_uuid.mp3
function extractDateTimeFromFilename(filename: string): { date: string; time: string; timestamp: string } | null {
  try {
    const match = filename.match(/_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_/);
    if (!match) return null;
    
    const [, year, month, day, hour, minute, second] = match;
    
    // Crear timestamp UTC en formato ISO 8601
    const timestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:${second}`,
      timestamp
    };
  } catch (error) {
    console.error('Error extrayendo fecha de filename:', error);
    return null;
  }
}

// Función para verificar si una grabación ya existe
async function recordingExists(filename: string): Promise<boolean> {
  try {
    const data = await supabaseDirect.request(
      `recordings?select=id&filename=eq.${encodeURIComponent(filename)}&limit=1`
    );
    return data && data.length > 0;
  } catch (error) {
    console.error('Error verificando existencia:', error);
    return false;
  }
}

// Función para insertar grabación en Supabase
async function insertRecording(recording: any, radioId: string, dateTime: any) {
  try {
    // Generar ID único
    const recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const data = {
      id: recordingId,
      radio_id: radioId,
      filename: recording.filename,
      file_path: recording.path || `recordings/${dateTime.date}/${recording.filename}`,
      file_size: recording.size,
      duration_seconds: 0, // Se actualizará con FFprobe más adelante
      recorded_at: dateTime.timestamp,
      vps_created_at: recording.created || dateTime.timestamp,
      metadata: {
        original_filename: recording.filename,
        extracted_from: 'vps_filename'
      },
      status: 'active'
    };
    
    const result = await supabaseDirect.request('recordings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    console.log(`✅ Grabación insertada: ${recording.filename}`);
    return result;
  } catch (error) {
    console.error(`❌ Error insertando grabación ${recording.filename}:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Sincronizando grabaciones VPS → Supabase...');
    
    // Obtener grabaciones del VPS
    const response = await fetch(`${VPS_API_URL}/recordings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error VPS: ${response.status}`);
    }
    
    const vpsData = await response.json();
    const recordings = vpsData.recordings || [];
    
    console.log(`📥 ${recordings.length} grabaciones encontradas en VPS`);
    
    // Procesar cada grabación
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const recording of recordings) {
      try {
        // Extraer radio_id desde filename
        const radioIdMatch = recording.filename.match(/^radio_([^_]+_[^_]+)_/);
        if (!radioIdMatch) {
          console.warn(`⚠️ No se pudo extraer radio_id de: ${recording.filename}`);
          errors++;
          continue;
        }
        
        const radioId = `radio_${radioIdMatch[1]}`;
        
        // Extraer fecha/hora del filename
        const dateTime = extractDateTimeFromFilename(recording.filename);
        if (!dateTime) {
          console.warn(`⚠️ No se pudo extraer fecha de: ${recording.filename}`);
          errors++;
          continue;
        }
        
        // Verificar si ya existe
        const exists = await recordingExists(recording.filename);
        if (exists) {
          console.log(`⏭️ Grabación ya existe: ${recording.filename}`);
          skipped++;
          continue;
        }
        
        // Insertar en Supabase
        await insertRecording(recording, radioId, dateTime);
        inserted++;
        
      } catch (error) {
        console.error(`❌ Error procesando ${recording.filename}:`, error);
        errors++;
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: `Sincronización completada: ${inserted} insertadas, ${skipped} existentes, ${errors} errores`,
      details: { inserted, skipped, errors }
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Endpoint para forzar sincronización (admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (opcional pero recomendado)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ status: 'error', message: 'No autorizado' }, { status: 401 });
    }
    
    // Ejecutar sincronización
    return await GET(request);
  } catch (error) {
    console.error('❌ Error en sincronización forzada:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}