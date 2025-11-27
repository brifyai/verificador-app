import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { RadioImportSchema } from '@/lib/schemas/radio.schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// --- Tipo de dato para una radio que viene del archivo de importación ---
type RadioImportData = {
  name: string;
  region: string;
  city?: string;
  streamUrl?: string;
  URL?: string; // Campo alternativo para la URL
  frequency?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
};

// --- GET: Obtener estadísticas (Corregido y Tipado) ---
// Esta función ya estaba bien, pero la mejoramos un poco.
export async function GET() {
  try {
    const [totalResult, activeResult, regionsResult] = await Promise.all([
      supabaseDirect.request('radios?select=count'),
      supabaseDirect.request('radios?select=count&status=eq.ACTIVE'),
      supabaseDirect.request('radios?select=region')
    ]);

    const totalRadios = totalResult[0]?.count || 0;
    const activeRadios = activeResult[0]?.count || 0;
    
    const regions = [...new Set(regionsResult.map((r: any) => r.region).filter(Boolean))];

    const stats = {
      total: totalRadios,
      active: activeRadios,
      inactive: totalRadios - activeRadios,
      regions,
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- POST: Importación Masiva (con límite de 500) ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validationResult = RadioImportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false,
        error: 'Datos de importación inválidos', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const radios = validationResult.data.radios;
    logger.log(`📥 Importando ${radios.length} radios...`);

    const mapPlatform = (url: string | null): string => {
      if (!url) return 'OTHER';
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('youtube')) return 'YOUTUBE';
      if (lowerUrl.includes('facebook')) return 'FACEBOOK';
      if (lowerUrl.includes('twitch')) return 'TWITCH';
      if (lowerUrl.includes('icecast')) return 'ICECAST';
      if (lowerUrl.includes('shoutcast')) return 'SHOUTCAST';
      if (lowerUrl.includes('rtmp')) return 'RTMP';
      return 'HTTP_STREAM';
    };

    const operations = radios.map(radio => {
      const streamUrl = radio.streamUrl?.trim() || radio.URL?.trim() || '';
      const name = radio.name?.trim() || 'Nombre Desconocido';
      const region = radio.region?.trim() || 'Región Desconocida';

      const dataForDb = {
        name,
        region,
        stream_url: streamUrl,
        platform: mapPlatform(streamUrl),
        status: streamUrl ? 'ACTIVE' : 'INACTIVE',
        description: radio.description || `Radio ${name} de ${region}`,
        metadata: {
          city: radio.city?.trim() || '',
          frequency: radio.frequency || '',
          website: radio.website || '',
          logo: radio.logo || '',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verificar si ya existe una radio con el mismo nombre y región
      return supabaseDirect.request(`radios?select=*&name=eq.${name}&region=eq.${region}`)
        .then(async (existing) => {
          if (existing.length > 0) {
            // Actualizar existente
            return supabaseDirect.request(`radios?id=eq.${existing[0].id}`, {
              method: 'PATCH',
              body: JSON.stringify(dataForDb),
              headers: { 'Prefer': 'return=representation' }
            });
          } else {
            // Crear nuevo
            return supabaseDirect.request('radios', {
              method: 'POST',
              body: JSON.stringify(dataForDb),
              headers: { 'Prefer': 'return=representation' }
            });
          }
        });
    });

    // Ejecutar todas las operaciones en paralelo
    const results = await Promise.all(operations);

    logger.log(`Importación exitosa: ${results.length} radios procesadas.`);
    return NextResponse.json({
      success: true,
      message: `Se procesaron ${results.length} radios.`,
      count: results.length
    });

  } catch (error: any) {
    logger.error('Error en importación masiva:', error);
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      return NextResponse.json({ error: 'Error de datos duplicados durante la importación.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}