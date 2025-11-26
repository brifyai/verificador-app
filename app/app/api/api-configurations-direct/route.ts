import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

/**
 * GET /api/api-configurations-direct
 * Obtiene las configuraciones de API de transcripción usando Supabase Direct
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    console.log('🔍 Obteniendo configuraciones de API, solo habilitadas:', enabledOnly);

    // Obtener todas las configuraciones
    const configurations = await supabaseDirect.request('api_configurations?select=*&order=priority.asc');

    // Filtrar si es necesario
    const filteredConfigurations = enabledOnly 
      ? configurations.filter((config: any) => config.enabled === true)
      : configurations;

    // Transformar al formato esperado por el frontend
    const transformedConfigs = filteredConfigurations.map((config: any) => ({
      id: config.id,
      provider: config.provider,
      model: config.model,
      enabled: config.enabled,
      priority: config.priority,
      costPerUnit: config.cost_per_unit || 0,
      rateLimit: config.rate_limit || 100,
      metadata: config.metadata || {}
    }));

    console.log(`✅ ${transformedConfigs.length} configuraciones obtenidas`);

    return NextResponse.json({
      success: true,
      data: transformedConfigs,
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo configuraciones de API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener configuraciones de API' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-configurations-direct
 * Crea una nueva configuración de API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📝 Creando nueva configuración de API:', body);

    const data = {
      provider: body.provider,
      model: body.model,
      enabled: body.enabled !== undefined ? body.enabled : true,
      priority: body.priority || 1,
      cost_per_unit: body.costPerUnit || 0,
      rate_limit: body.rateLimit || 100,
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await supabaseDirect.request('api_configurations', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });

    console.log('✅ Configuración de API creada exitosamente');

    return NextResponse.json({
      success: true,
      data: result[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creando configuración de API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear configuración de API' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/api-configurations-direct
 * Actualiza una configuración de API
 */
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log('🔄 Actualizando configuración de API:', id, body);

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Convertir camelCase a snake_case si es necesario
    if (updateData.costPerUnit !== undefined) {
      updateData.cost_per_unit = updateData.costPerUnit;
      delete updateData.costPerUnit;
    }
    if (updateData.rateLimit !== undefined) {
      updateData.rate_limit = updateData.rateLimit;
      delete updateData.rateLimit;
    }

    const result = await supabaseDirect.request(`api_configurations?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
      headers: { 'Prefer': 'return=representation' }
    });

    console.log('✅ Configuración de API actualizada exitosamente');

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error: any) {
    console.error('❌ Error actualizando configuración de API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar configuración de API' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-configurations-direct
 * Elimina una configuración de API
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    console.log('🗑️ Eliminando configuración de API:', id);

    await supabaseDirect.request(`api_configurations?id=eq.${id}`, {
      method: 'DELETE'
    });

    console.log('✅ Configuración de API eliminada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('❌ Error eliminando configuración de API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar configuración de API' },
      { status: 500 }
    );
  }
}