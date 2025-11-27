import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';
import { logger } from '@/lib/logger';
import { RadioImportSchema } from '@/lib/schemas/radio.schema';
import { z } from 'zod';

// GET: Obtener estadísticas
export async function GET() {
  try {
    const allRadios = await supabaseDirect.request('radios?select=id');
    const activeRadios = await supabaseDirect.request('radios?select=id&status=eq.ACTIVE');
    
    const regionsResult = await supabaseDirect.request('radios?select=region');
    const uniqueRegions = [...new Set(regionsResult.map((r: any) => r.region).filter(Boolean))];

    const stats = {
      total: allRadios.length,
      active: activeRadios.length,
      inactive: allRadios.length - activeRadios.length,
      regions: uniqueRegions,
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Importación Masiva
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
      if (lowerUrl.includes('icecast') || lowerUrl.includes('shoutcast')) return 'ICECAST';
      if (lowerUrl.includes('rtmp')) return 'RTMP';
      return 'HTTP_STREAM';
    };

    // Procesar radios en batches para evitar timeouts
    const results = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < radios.length; i += BATCH_SIZE) {
      const batch = radios.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (radio: any) => {
        try {
          const streamUrl = radio.streamUrl?.trim() || radio.URL?.trim() || '';
          const name = radio.name?.trim() || 'Nombre Desconocido';
          const region = radio.region?.trim() || 'Región Desconocida';

          const metadata = {
            city: radio.city?.trim() || '',
            frequency: radio.frequency || '',
            website: radio.website || '',
            logo: radio.logo || '',
            description: radio.description || `Radio ${name} de ${region}`,
          };

          // Verificar si existe la radio
          const existingRadios = await supabaseDirect.request(
            `radios?select=id&name=eq.${encodeURIComponent(name)}&region=eq.${encodeURIComponent(region)}`
          );

          const radioData = {
            name,
            region,
            stream_url: streamUrl,
            platform: mapPlatform(streamUrl),
            status: streamUrl ? 'ACTIVE' : 'INACTIVE',
            priority: radio.priority || 1,
            cost_per_hour: radio.costPerHour || 0.0,
            metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (existingRadios.length > 0) {
            // Actualizar radio existente
            const updated = await supabaseDirect.request(
              `radios?id=eq.${existingRadios[0].id}`,
              {
                method: 'PATCH',
                body: JSON.stringify(radioData),
                headers: { 'Prefer': 'return=representation' }
              }
            );
            return { success: true, type: 'updated', id: updated[0].id };
          } else {
            // Crear nueva radio
            const created = await supabaseDirect.request('radios', {
              method: 'POST',
              body: JSON.stringify(radioData),
              headers: { 'Prefer': 'return=representation' }
            });
            return { success: true, type: 'created', id: created[0].id };
          }
        } catch (error: any) {
          logger.error(`Error procesando radio ${radio.name}:`, error);
          return { success: false, error: error.message, radio: radio.name };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const createdCount = results.filter(r => r.success && r.type === 'created').length;
    const updatedCount = results.filter(r => r.success && r.type === 'updated').length;
    const failedCount = results.filter(r => !r.success).length;

    logger.log(`Importación exitosa: ${createdCount} creadas, ${updatedCount} actualizadas, ${failedCount} fallidas.`);
    
    return NextResponse.json({
      success: true,
      message: `Se procesaron ${results.length} radios: ${createdCount} creadas, ${updatedCount} actualizadas, ${failedCount} fallidas.`,
      count: results.length,
      created: createdCount,
      updated: updatedCount,
      failed: failedCount,
      results
    });

  } catch (error) {
    logger.error('Error en importación masiva:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}