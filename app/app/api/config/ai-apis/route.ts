
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { multiProviderTranscriptionService } from '@/lib/transcription-providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Obtener configuraciones desde la base de datos
    const configs = await prisma.apiConfiguration.findMany({
      orderBy: { priority: 'asc' }
    });

    // Transformar a formato esperado por el frontend
    const configMap: Record<string, any> = {};
    
    for (const config of configs) {
      configMap[config.provider] = {
        apiKey: config.apiKey ? '***' : '', // Ocultar API key real
        model: config.model || '',
        enabled: config.enabled,
        priority: config.priority,
        costPerUnit: config.costPerUnit,
        rateLimit: config.rateLimit,
        metadata: config.metadata
      };
    }

    // Si no hay configuraciones, devolver valores por defecto
    if (configs.length === 0) {
      const defaultProviders = [
        'abacus', 'groq', 'openai', 'deepgram', 'assemblyai', 
        'revai', 'google', 'aws', 'azure', 'elevenlabs', 'speechmatics'
      ];

      for (const provider of defaultProviders) {
        configMap[provider] = {
          apiKey: '',
          model: '',
          enabled: false,
          priority: defaultProviders.indexOf(provider) + 1,
          costPerUnit: 0,
          rateLimit: null,
          metadata: {}
        };
      }
    }

    return NextResponse.json({
      success: true,
      config: configMap
    });

  } catch (error) {
    console.error('Error getting AI APIs config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error obteniendo configuración de APIs' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Configuración inválida' },
        { status: 400 }
      );
    }

    console.log('💾 Saving AI APIs configuration to database...');

    // Procesar cada proveedor en la configuración
    for (const [provider, settings] of Object.entries(config) as [string, any][]) {
      if (!settings || typeof settings !== 'object') continue;

      // Preparar datos para la base de datos
      const configData = {
        provider,
        apiKey: settings.apiKey && settings.apiKey !== '***' ? settings.apiKey : undefined,
        model: settings.model || null,
        enabled: Boolean(settings.enabled),
        priority: Number(settings.priority) || 1,
        costPerUnit: Number(settings.costPerUnit) || 0,
        rateLimit: settings.rateLimit ? Number(settings.rateLimit) : null,
        metadata: settings.metadata || {}
      };

      // Solo actualizar apiKey si se proporciona una nueva
      const updateData: any = {
        model: configData.model,
        enabled: configData.enabled,
        priority: configData.priority,
        costPerUnit: configData.costPerUnit,
        rateLimit: configData.rateLimit,
        metadata: configData.metadata
      };

      if (configData.apiKey) {
        updateData.apiKey = configData.apiKey;
      }

      // Upsert en la base de datos
      await prisma.apiConfiguration.upsert({
        where: { provider },
        update: updateData,
        create: {
          provider,
          apiKey: configData.apiKey,
          model: configData.model,
          enabled: configData.enabled,
          priority: configData.priority,
          costPerUnit: configData.costPerUnit,
          rateLimit: configData.rateLimit,
          metadata: configData.metadata
        }
      });
    }

    // Recargar configuración en el servicio de transcripción
    await multiProviderTranscriptionService.reloadConfiguration();

    console.log('✅ AI APIs configuration saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Configuración de APIs de IA guardada exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error saving AI APIs config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error guardando configuración de APIs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
