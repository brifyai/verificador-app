#!/usr/bin/env node

/**
 * Script para configurar PocketBase con el schema equivalente al de Prisma
 * Este script crea todas las colecciones necesarias en PocketBase
 */

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const ADMIN_EMAIL = 'camiloalegriabarra@gmail.com';
const ADMIN_PASSWORD = 'Aintelligence2025$';
const ADMIN_COLLECTION = '_superusers';

// Schema de colecciones para PocketBase (equivalente al schema.prisma)
const collections = [
  {
    name: 'users',
    type: 'auth',
    schema: [
      { name: 'name', type: 'text', required: false },
      { name: 'role', type: 'select', required: true, values: ['USER', 'ADMIN', 'MODERATOR'], default: 'USER' },
      { name: 'active', type: 'bool', required: true, default: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'radios',
    type: 'base',
    schema: [
      { name: 'name', type: 'text', required: true },
      { name: 'streamUrl', type: 'text', required: true },
      { name: 'platform', type: 'select', required: true, values: ['YOUTUBE', 'TWITCH', 'FACEBOOK', 'ICECAST', 'SHOUTCAST', 'HTTP_STREAM', 'RTMP', 'OTHER'] },
      { name: 'region', type: 'text', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'status', type: 'select', required: true, values: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR'], default: 'ACTIVE' },
      { name: 'priority', type: 'number', required: true, default: 1 },
      { name: 'costPerHour', type: 'number', required: true, default: 0 },
      { name: 'metadata', type: 'json', required: false },
      { name: 'lastVerificationStatus', type: 'select', required: false, values: ['ONLINE', 'OFFLINE'] },
      { name: 'lastVerifiedAt', type: 'date', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'phrases',
    type: 'base',
    schema: [
      { name: 'phrase', type: 'text', required: true },
      { name: 'brand', type: 'text', required: true },
      { name: 'campaign', type: 'text', required: false },
      { name: 'category', type: 'select', required: true, values: ['PRODUCT', 'SERVICE', 'PROMOTION', 'EVENT', 'BRAND', 'INSTITUTIONAL'], default: 'PRODUCT' },
      { name: 'description', type: 'text', required: false },
      { name: 'confidence', type: 'number', required: true, default: 0.85 },
      { name: 'priority', type: 'number', required: true, default: 1 },
      { name: 'active', type: 'bool', required: true, default: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'phrase_variants',
    type: 'base',
    schema: [
      { name: 'phrase', type: 'relation', required: true, collectionId: 'phrases', cascade: true },
      { name: 'variant', type: 'text', required: true },
      { name: 'similarity', type: 'number', required: true, default: 0.8 }
    ]
  },
  {
    name: 'monitoring_sessions',
    type: 'base',
    schema: [
      { name: 'radio', type: 'relation', required: true, collectionId: 'radios', cascade: true },
      { name: 'user', type: 'relation', required: true, collectionId: 'users' },
      { name: 'status', type: 'select', required: true, values: ['ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'COMPLETED'], default: 'ACTIVE' },
      { name: 'startTime', type: 'date', required: true },
      { name: 'endTime', type: 'date', required: false },
      { name: 'captureInterval', type: 'number', required: true, default: 30 },
      { name: 'captureDuration', type: 'number', required: true, default: 10 },
      { name: 'totalCaptures', type: 'number', required: true, default: 0 },
      { name: 'totalDetections', type: 'number', required: true, default: 0 },
      { name: 'lastCaptureAt', type: 'date', required: false },
      { name: 'lastDetectionAt', type: 'date', required: false },
      { name: 'recordingStartHour', type: 'number', required: false, default: 5 },
      { name: 'recordingEndHour', type: 'number', required: false, default: 2 },
      { name: 'configuration', type: 'json', required: false },
      { name: 'metadata', type: 'json', required: false }
    ]
  },
  {
    name: 'captures',
    type: 'base',
    schema: [
      { name: 'session', type: 'relation', required: true, collectionId: 'monitoring_sessions', cascade: true },
      { name: 'audioPath', type: 'text', required: false },
      { name: 'duration', type: 'number', required: true },
      { name: 'fileSize', type: 'number', required: false },
      { name: 'format', type: 'text', required: false },
      { name: 'bitrate', type: 'number', required: false },
      { name: 'sampleRate', type: 'number', required: false },
      { name: 'status', type: 'select', required: true, values: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'TRANSCRIBED'], default: 'PROCESSING' },
      { name: 'capturedAt', type: 'date', required: true },
      { name: 'processedAt', type: 'date', required: false },
      { name: 'transcriptionText', type: 'text', required: false },
      { name: 'confidence', type: 'number', required: false },
      { name: 'provider', type: 'text', required: false },
      { name: 'processingTime', type: 'number', required: false },
      { name: 'cost', type: 'number', required: true, default: 0 },
      { name: 'metadata', type: 'json', required: false }
    ]
  },
  {
    name: 'detections',
    type: 'base',
    schema: [
      { name: 'session', type: 'relation', required: true, collectionId: 'monitoring_sessions' },
      { name: 'capture', type: 'relation', required: true, collectionId: 'captures' },
      { name: 'radio', type: 'relation', required: true, collectionId: 'radios' },
      { name: 'phrase', type: 'relation', required: true, collectionId: 'phrases' },
      { name: 'detectedText', type: 'text', required: true },
      { name: 'originalText', type: 'text', required: true },
      { name: 'confidence', type: 'number', required: true },
      { name: 'similarity', type: 'number', required: true },
      { name: 'timestamp', type: 'date', required: true },
      { name: 'audioTimestamp', type: 'number', required: false },
      { name: 'verified', type: 'bool', required: true, default: false },
      { name: 'falsePositive', type: 'bool', required: true, default: false },
      { name: 'cost', type: 'number', required: true, default: 0 },
      { name: 'metadata', type: 'json', required: false }
    ]
  },
  {
    name: 'api_configurations',
    type: 'base',
    schema: [
      { name: 'provider', type: 'text', required: true, unique: true },
      { name: 'apiKey', type: 'text', required: false },
      { name: 'model', type: 'text', required: false },
      { name: 'enabled', type: 'bool', required: true, default: false },
      { name: 'priority', type: 'number', required: true, default: 1 },
      { name: 'costPerUnit', type: 'number', required: true, default: 0 },
      { name: 'rateLimit', type: 'number', required: false },
      { name: 'metadata', type: 'json', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'radio_pricing_rules',
    type: 'base',
    schema: [
      { name: 'radio', type: 'relation', required: true, collectionId: 'radios', cascade: true },
      { name: 'name', type: 'text', required: true },
      { name: 'pricePerDetection', type: 'number', required: true },
      { name: 'effectiveDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: false },
      { name: 'description', type: 'text', required: false },
      { name: 'active', type: 'bool', required: true, default: true },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'reports',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', required: true, collectionId: 'users' },
      { name: 'name', type: 'text', required: true },
      { name: 'description', type: 'text', required: false },
      { name: 'type', type: 'select', required: true, values: ['DETECTIONS', 'ANALYTICS', 'COSTS', 'PERFORMANCE', 'CUSTOM'] },
      { name: 'filters', type: 'json', required: true },
      { name: 'data', type: 'json', required: true },
      { name: 'format', type: 'text', required: true, default: 'json' },
      { name: 'status', type: 'select', required: true, values: ['GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED'], default: 'GENERATING' },
      { name: 'filePath', type: 'text', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'generatedAt', type: 'date', required: false }
    ]
  },
  {
    name: 'jobs',
    type: 'base',
    schema: [
      { name: 'type', type: 'select', required: true, values: ['AUDIO_CAPTURE', 'TRANSCRIPTION', 'PHRASE_DETECTION', 'REPORT_GENERATION', 'SYSTEM_MAINTENANCE', 'DATA_CLEANUP'] },
      { name: 'payload', type: 'json', required: true },
      { name: 'status', type: 'select', required: true, values: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING'], default: 'PENDING' },
      { name: 'priority', type: 'number', required: true, default: 1 },
      { name: 'attempts', type: 'number', required: true, default: 0 },
      { name: 'maxAttempts', type: 'number', required: true, default: 3 },
      { name: 'error', type: 'text', required: false },
      { name: 'result', type: 'json', required: false },
      { name: 'scheduledAt', type: 'date', required: true },
      { name: 'startedAt', type: 'date', required: false },
      { name: 'completedAt', type: 'date', required: false },
      { name: 'createdAt', type: 'date', required: true }
    ]
  },
  {
    name: 'notifications',
    type: 'base',
    schema: [
      { name: 'title', type: 'text', required: true },
      { name: 'message', type: 'text', required: true },
      { name: 'type', type: 'select', required: true, values: ['DETECTION', 'ERROR', 'WARNING', 'INFO', 'SYSTEM'] },
      { name: 'priority', type: 'select', required: true, values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
      { name: 'read', type: 'bool', required: true, default: false },
      { name: 'data', type: 'json', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'readAt', type: 'date', required: false }
    ]
  },
  {
    name: 'cache',
    type: 'base',
    schema: [
      { name: 'key', type: 'text', required: true, unique: true },
      { name: 'value', type: 'json', required: true },
      { name: 'expiresAt', type: 'date', required: true },
      { name: 'createdAt', type: 'date', required: true }
    ]
  },
  {
    name: 'system_logs',
    type: 'base',
    schema: [
      { name: 'level', type: 'select', required: true, values: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
      { name: 'message', type: 'text', required: true },
      { name: 'context', type: 'text', required: false },
      { name: 'metadata', type: 'json', required: false },
      { name: 'timestamp', type: 'date', required: true }
    ]
  },
  {
    name: 'billing_profiles',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', required: true, collectionId: 'users', unique: true },
      { name: 'companyName', type: 'text', required: false },
      { name: 'legalName', type: 'text', required: false },
      { name: 'taxId', type: 'text', required: false },
      { name: 'billingEmail', type: 'text', required: false },
      { name: 'address', type: 'text', required: false },
      { name: 'city', type: 'text', required: false },
      { name: 'region', type: 'text', required: false },
      { name: 'postalCode', type: 'text', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'invoices',
    type: 'base',
    schema: [
      { name: 'billingProfile', type: 'relation', required: true, collectionId: 'billing_profiles', cascade: true },
      { name: 'invoiceNumber', type: 'text', required: true, unique: true },
      { name: 'issueDate', type: 'date', required: true },
      { name: 'dueDate', type: 'date', required: true },
      { name: 'status', type: 'select', required: true, values: ['PAID', 'FAILED', 'PENDING', 'VOID'], default: 'PENDING' },
      { name: 'subtotal', type: 'number', required: true },
      { name: 'tax', type: 'number', required: true },
      { name: 'total', type: 'number', required: true },
      { name: 'currency', type: 'text', required: true, default: 'CLP' },
      { name: 'paymentDate', type: 'date', required: false },
      { name: 'paymentMethod', type: 'text', required: false },
      { name: 'notes', type: 'text', required: false },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  },
  {
    name: 'invoice_line_items',
    type: 'base',
    schema: [
      { name: 'invoice', type: 'relation', required: true, collectionId: 'invoices', cascade: true },
      { name: 'description', type: 'text', required: true },
      { name: 'quantity', type: 'number', required: true },
      { name: 'unitPrice', type: 'number', required: true },
      { name: 'total', type: 'number', required: true },
      { name: 'radio', type: 'relation', required: false, collectionId: 'radios' },
      { name: 'session', type: 'relation', required: false, collectionId: 'monitoring_sessions' },
      { name: 'capture', type: 'relation', required: false, collectionId: 'captures' },
      { name: 'detection', type: 'relation', required: false, collectionId: 'detections' },
      { name: 'createdAt', type: 'date', required: true }
    ]
  },
  {
    name: 'subscriptions',
    type: 'base',
    schema: [
      { name: 'billingProfile', type: 'relation', required: true, collectionId: 'billing_profiles', unique: true },
      { name: 'planId', type: 'text', required: true },
      { name: 'status', type: 'select', required: true, values: ['ACTIVE', 'CANCELED', 'TRIALING', 'PAST_DUE'] },
      { name: 'currentPeriodStart', type: 'date', required: true },
      { name: 'currentPeriodEnd', type: 'date', required: true },
      { name: 'canceledAt', type: 'date', required: false }
    ]
  },
  {
    name: 'payment_methods',
    type: 'base',
    schema: [
      { name: 'user', type: 'relation', required: true, collectionId: 'users', cascade: true },
      { name: 'type', type: 'select', required: true, values: ['CREDIT_CARD', 'BANK_TRANSFER', 'MERCADO_PAGO'] },
      { name: 'name', type: 'text', required: true },
      { name: 'lastDigits', type: 'text', required: false },
      { name: 'expiryDate', type: 'text', required: false },
      { name: 'isDefault', type: 'bool', required: true, default: false },
      { name: 'status', type: 'select', required: true, values: ['ACTIVE', 'EXPIRED', 'PENDING'], default: 'ACTIVE' },
      { name: 'createdAt', type: 'date', required: true },
      { name: 'updatedAt', type: 'date', required: true }
    ]
  }
];

async function setupPocketBase() {
  console.log('🔧 Configurando PocketBase...\n');

  try {
    // 1. Autenticar como admin
    console.log('1. Autenticando como administrador...');
    const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/${ADMIN_COLLECTION}/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Error de autenticación: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const token = authData.token;
    console.log('✅ Autenticación exitosa\n');

    // 2. Crear colecciones
    console.log('2. Creando colecciones...');
    
    for (const collection of collections) {
      console.log(`   Creando colección: ${collection.name}...`);
      
      const createResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({
          name: collection.name,
          type: collection.type,
          schema: collection.schema,
          indexes: collection.indexes || []
        })
      });

      if (createResponse.ok) {
        console.log(`   ✅ Colección ${collection.name} creada`);
      } else {
        const error = await createResponse.json();
        if (error.message && error.message.includes('already exists')) {
          console.log(`   ⚠️  Colección ${collection.name} ya existe, saltando...`);
        } else {
          console.log(`   ❌ Error creando ${collection.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ Configuración de PocketBase completada!');
    console.log('\n📋 Siguientes pasos:');
    console.log('1. Instalar dependencia: npm install pocketbase');
    console.log('2. Actualizar lib/db.ts para usar PocketBase');
    console.log('3. Migrar datos desde Supabase');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar setup
setupPocketBase();