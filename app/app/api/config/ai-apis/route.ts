
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { multiProviderTranscriptionService } from '@/lib/transcription-providers';

export const dynamic = 'force-dynamic';

// Mapeo de nombres entre frontend y backend
const PROVIDER_NAME_MAPPING: Record<string, string> = {
  'abacusAI': 'abacus',
  'groq': 'groq',
  'openai': 'openai',
  'assemblyai': 'assemblyai',
  'revai': 'revai',
  'deepgram': 'deepgram',
  'speechmatics': 'speechmatics',
  'googleCloud': 'google',
  'awsTranscribe': 'aws',
  'azureSpeech': 'azure',
  'elevenlabs': 'elevenlabs'
};

// Mapeo inverso
const BACKEND_TO_FRONTEND_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_NAME_MAPPING).map(([k, v]) => [v, k])
);

// Configuración por defecto de cada proveedor
const DEFAULT_PROVIDER_CONFIG: Record<string, any> = {
  abacus: { 
    priority: 1, 
    costPerUnit: 0.03, 
    rateLimit: 60, 
    model: 'whisper-large-v3',
    baseUrl: 'https://api.abacus.ai'
  },
  groq: { 
    priority: 2, 
    costPerUnit: 0.006, 
    rateLimit: 30, 
    model: 'whisper-large-v3' 
  },
  openai: { 
    priority: 3, 
    costPerUnit: 0.012, 
    rateLimit: 50, 
    model: 'whisper-1' 
  },
  assemblyai: { 
    priority: 4, 
    costPerUnit: 0.007, 
    rateLimit: 40, 
    model: 'best' 
  },
  deepgram: { 
    priority: 5, 
    costPerUnit: 0.005, 
    rateLimit: 60, 
    model: 'nova-2' 
  },
  revai: { 
    priority: 6, 
    costPerUnit: 0.02, 
    rateLimit: 20 
  },
  speechmatics: { 
    priority: 7, 
    costPerUnit: 0.008, 
    rateLimit: 30 
  },
  google: { 
    priority: 8, 
    costPerUnit: 0.01, 
    rateLimit: 50, 
    model: 'latest_long' 
  },
  aws: { 
    priority: 9, 
    costPerUnit: 0.004, 
    rateLimit: 100, 
    region: 'us-east-1' 
  },
  azure: { 
    priority: 10, 
    costPerUnit: 0.01, 
    rateLimit: 50, 
    region: 'eastus' 
  },
  elevenlabs: { 
    priority: 11, 
    costPerUnit: 0.015, 
    rateLimit: 30, 
    model: 'eleven_multilingual_v2' 
  }
};

export async function GET() {
  try {
    // Obtener configuraciones desde la base de datos
    const configs = await prisma.apiConfiguration.findMany({
      orderBy: { priority: 'asc' }
    });

    // Transformar a formato esperado por el frontend
    const configMap: Record<string, any> = {};
    
    for (const config of configs) {
      const frontendName = BACKEND_TO_FRONTEND_MAPPING[config.provider] || config.provider;
      const metadata = config.metadata as any || {};
      
      configMap[frontendName] = {
        apiKey: config.apiKey ? '***' : '',
        model: config.model || '',
        enabled: config.enabled,
        priority: config.priority,
        costPerUnit: config.costPerUnit,
        rateLimit: config.rateLimit,
        // Campos especiales según el proveedor
        ...(config.provider === 'abacus' && { baseUrl: metadata.baseUrl || 'https://api.abacus.ai' }),
        ...(config.provider === 'aws' && { 
          accessKeyId: metadata.accessKeyId ? '***' : '',
          secretAccessKey: metadata.secretAccessKey ? '***' : '',
          region: metadata.region || 'us-east-1'
        }),
        ...(config.provider === 'azure' && { 
          subscriptionKey: config.apiKey ? '***' : '',
          region: metadata.region || 'eastus'
        })
      };
    }

    // Si no hay configuraciones, devolver valores por defecto
    if (configs.length === 0) {
      for (const [backendName, defaults] of Object.entries(DEFAULT_PROVIDER_CONFIG)) {
        const frontendName = BACKEND_TO_FRONTEND_MAPPING[backendName] || backendName;
        configMap[frontendName] = {
          apiKey: '',
          model: defaults.model || '',
          enabled: false,
          priority: defaults.priority,
          costPerUnit: defaults.costPerUnit,
          rateLimit: defaults.rateLimit,
          ...(backendName === 'abacus' && { baseUrl: defaults.baseUrl }),
          ...(backendName === 'aws' && { 
            accessKeyId: '',
            secretAccessKey: '',
            region: defaults.region
          }),
          ...(backendName === 'azure' && { 
            subscriptionKey: '',
            region: defaults.region
          })
        };
      }
    }

    return NextResponse.json(configMap);

  } catch (error) {
    console.error('❌ Error getting AI APIs config:', error);
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
    
    // El frontend puede enviar directamente el config o dentro de un objeto
    const config = body.config || body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Configuración inválida' 
        },
        { status: 400 }
      );
    }

    console.log('💾 Saving AI APIs configuration to database...');
    
    let savedCount = 0;
    let errors: string[] = [];

    // Procesar cada proveedor en la configuración
    for (const [frontendName, settings] of Object.entries(config) as [string, any][]) {
      // Ignorar el campo 'settings' que es configuración general
      if (frontendName === 'settings' || !settings || typeof settings !== 'object') {
        continue;
      }

      try {
        // Convertir nombre del frontend al nombre del backend
        const backendProviderName = PROVIDER_NAME_MAPPING[frontendName] || frontendName;
        
        console.log(`📝 Processing ${frontendName} (backend: ${backendProviderName})`);

        // Preparar metadata según el proveedor
        let metadata: any = {};
        let apiKey: string | null = null;

        // Manejar campos especiales según el proveedor
        if (backendProviderName === 'abacus') {
          apiKey = settings.apiKey && settings.apiKey !== '***' ? settings.apiKey : null;
          metadata = {
            baseUrl: settings.baseUrl || 'https://api.abacus.ai'
          };
        } else if (backendProviderName === 'aws') {
          // AWS usa accessKeyId/secretAccessKey en lugar de apiKey
          metadata = {
            accessKeyId: settings.accessKeyId && settings.accessKeyId !== '***' ? settings.accessKeyId : null,
            secretAccessKey: settings.secretAccessKey && settings.secretAccessKey !== '***' ? settings.secretAccessKey : null,
            region: settings.region || 'us-east-1'
          };
          apiKey = null; // AWS no usa apiKey convencional
        } else if (backendProviderName === 'azure') {
          // Azure usa subscriptionKey
          apiKey = settings.subscriptionKey && settings.subscriptionKey !== '***' ? settings.subscriptionKey : null;
          metadata = {
            region: settings.region || 'eastus'
          };
        } else {
          // Proveedores estándar
          apiKey = settings.apiKey && settings.apiKey !== '***' ? settings.apiKey : null;
        }

        // Obtener configuración existente para preservar valores no modificados
        const existingConfig = await prisma.apiConfiguration.findUnique({
          where: { provider: backendProviderName }
        });

        // Preparar datos para actualización
        const updateData: any = {
          enabled: Boolean(settings.enabled),
          model: settings.model || null,
        };

        // Solo actualizar priority, costPerUnit y rateLimit si se proporcionan
        if (settings.priority !== undefined) {
          updateData.priority = Number(settings.priority);
        }
        if (settings.costPerUnit !== undefined) {
          updateData.costPerUnit = Number(settings.costPerUnit);
        }
        if (settings.rateLimit !== undefined) {
          updateData.rateLimit = settings.rateLimit ? Number(settings.rateLimit) : null;
        }

        // Solo actualizar apiKey si se proporciona una nueva (no es ***)
        if (apiKey !== null) {
          updateData.apiKey = apiKey;
        }

        // Actualizar metadata preservando valores existentes
        if (existingConfig?.metadata) {
          const existingMetadata = existingConfig.metadata as any;
          metadata = { ...existingMetadata, ...metadata };
          
          // Preservar credenciales de AWS si no se proporcionaron nuevas
          if (backendProviderName === 'aws') {
            if (!metadata.accessKeyId && existingMetadata.accessKeyId) {
              metadata.accessKeyId = existingMetadata.accessKeyId;
            }
            if (!metadata.secretAccessKey && existingMetadata.secretAccessKey) {
              metadata.secretAccessKey = existingMetadata.secretAccessKey;
            }
          }
        }

        updateData.metadata = metadata;

        // Preparar datos para creación (usando valores por defecto si no existen)
        const defaults = DEFAULT_PROVIDER_CONFIG[backendProviderName] || {};
        const createData = {
          provider: backendProviderName,
          apiKey: apiKey,
          model: settings.model || defaults.model || null,
          enabled: Boolean(settings.enabled),
          priority: Number(settings.priority) || defaults.priority || 99,
          costPerUnit: Number(settings.costPerUnit) || defaults.costPerUnit || 0,
          rateLimit: settings.rateLimit ? Number(settings.rateLimit) : defaults.rateLimit || null,
          metadata: metadata
        };

        // Upsert en la base de datos
        await prisma.apiConfiguration.upsert({
          where: { provider: backendProviderName },
          update: updateData,
          create: createData
        });

        savedCount++;
        console.log(`✅ Saved ${frontendName}`);

      } catch (providerError: any) {
        console.error(`❌ Error saving ${frontendName}:`, providerError);
        errors.push(`${frontendName}: ${providerError.message}`);
      }
    }

    // Recargar configuración en el servicio de transcripción
    try {
      await multiProviderTranscriptionService.reloadConfiguration();
      console.log('🔄 Transcription service reloaded');
    } catch (reloadError) {
      console.error('⚠️ Warning: Could not reload transcription service:', reloadError);
    }

    console.log(`✅ AI APIs configuration saved successfully (${savedCount} providers)`);

    return NextResponse.json({
      success: true,
      message: `Configuración guardada exitosamente: ${savedCount} proveedor(es)`,
      savedCount,
      errors: errors.length > 0 ? errors : undefined
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
