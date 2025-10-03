#!/usr/bin/env tsx

/**
 * Script para inicializar los proveedores de API en la base de datos
 * Uso: npx tsx scripts/init-api-providers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PROVIDERS = [
  {
    provider: 'abacus',
    apiKey: null,
    model: 'whisper-large-v3',
    enabled: false,
    priority: 1,
    costPerUnit: 0.03,
    rateLimit: 60,
    metadata: {
      baseUrl: 'https://api.abacus.ai'
    }
  },
  {
    provider: 'groq',
    apiKey: null,
    model: 'whisper-large-v3',
    enabled: false,
    priority: 2,
    costPerUnit: 0.006,
    rateLimit: 30,
    metadata: {}
  },
  {
    provider: 'openai',
    apiKey: null,
    model: 'whisper-1',
    enabled: false,
    priority: 3,
    costPerUnit: 0.012,
    rateLimit: 50,
    metadata: {}
  },
  {
    provider: 'assemblyai',
    apiKey: null,
    model: 'best',
    enabled: false,
    priority: 4,
    costPerUnit: 0.007,
    rateLimit: 40,
    metadata: {}
  },
  {
    provider: 'deepgram',
    apiKey: null,
    model: 'nova-2',
    enabled: false,
    priority: 5,
    costPerUnit: 0.005,
    rateLimit: 60,
    metadata: {}
  },
  {
    provider: 'revai',
    apiKey: null,
    model: null,
    enabled: false,
    priority: 6,
    costPerUnit: 0.02,
    rateLimit: 20,
    metadata: {}
  },
  {
    provider: 'speechmatics',
    apiKey: null,
    model: null,
    enabled: false,
    priority: 7,
    costPerUnit: 0.008,
    rateLimit: 30,
    metadata: {}
  },
  {
    provider: 'google',
    apiKey: null,
    model: 'latest_long',
    enabled: false,
    priority: 8,
    costPerUnit: 0.01,
    rateLimit: 50,
    metadata: {}
  },
  {
    provider: 'aws',
    apiKey: null,
    model: null,
    enabled: false,
    priority: 9,
    costPerUnit: 0.004,
    rateLimit: 100,
    metadata: {
      region: 'us-east-1',
      accessKeyId: null,
      secretAccessKey: null
    }
  },
  {
    provider: 'azure',
    apiKey: null,
    model: null,
    enabled: false,
    priority: 10,
    costPerUnit: 0.01,
    rateLimit: 50,
    metadata: {
      region: 'eastus'
    }
  },
  {
    provider: 'elevenlabs',
    apiKey: null,
    model: 'eleven_multilingual_v2',
    enabled: false,
    priority: 11,
    costPerUnit: 0.015,
    rateLimit: 30,
    metadata: {}
  }
];

async function initializeProviders() {
  console.log('🚀 Iniciando proveedores de API...\n');

  for (const provider of DEFAULT_PROVIDERS) {
    try {
      const result = await prisma.apiConfiguration.upsert({
        where: { provider: provider.provider },
        update: {
          // Solo actualizar si no hay apiKey configurada
          priority: provider.priority,
          costPerUnit: provider.costPerUnit,
          rateLimit: provider.rateLimit,
          model: provider.model,
          metadata: provider.metadata
        },
        create: provider
      });

      console.log(`✅ ${provider.provider.padEnd(15)} - Priority: ${provider.priority}, Cost: $${provider.costPerUnit}/min`);
    } catch (error: any) {
      console.error(`❌ Error con ${provider.provider}:`, error.message);
    }
  }

  console.log('\n✅ Proveedores inicializados correctamente');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Ve a Configuración > APIs de Transcripción');
  console.log('   2. Configura las API keys de los proveedores que quieras usar');
  console.log('   3. Habilita los proveedores que configuraste');
  console.log('   4. Prueba las conexiones');
}

initializeProviders()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
