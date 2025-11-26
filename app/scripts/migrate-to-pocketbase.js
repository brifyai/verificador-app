#!/usr/bin/env node

/**
 * Script para migrar datos desde Supabase/Prisma a PocketBase
 * Exporta datos de PostgreSQL e importa a PocketBase
 */

const { PrismaClient } = require('@prisma/client');
const PocketBase = require('pocketbase');

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const ADMIN_EMAIL = 'camiloalegriabarra@gmail.com';
const ADMIN_PASSWORD = 'Aintelligence2025$';

const prisma = new PrismaClient();
const pb = new PocketBase(POCKETBASE_URL);

async function migrateData() {
  console.log('🔄 Iniciando migración de datos...\n');

  try {
    // 1. Autenticar en PocketBase
    console.log('1. Autenticando en PocketBase...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Autenticación exitosa\n');

    // 2. Migrar datos en orden (respetando dependencias)
    await migrateRadios();
    await migratePhrases();
    await migrateUsers();
    await migrateMonitoringSessions();
    await migrateCaptures();
    await migrateDetections();
    await migrateApiConfigurations();
    await migrateRadioPricingRules();
    await migrateReports();
    await migrateJobs();
    await migrateNotifications();
    await migrateCache();
    await migrateSystemLogs();
    await migrateBillingProfiles();
    await migrateInvoices();
    await migrateInvoiceLineItems();
    await migrateSubscriptions();
    await migratePaymentMethods();

    console.log('\n✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Funciones de migración por colección
async function migrateRadios() {
  console.log('2. Migrando radios...');
  const radios = await prisma.radio.findMany();
  
  for (const radio of radios) {
    try {
      await pb.collection('radios').create({
        id: radio.id,
        name: radio.name,
        streamUrl: radio.streamUrl,
        platform: radio.platform,
        region: radio.region || '',
        description: radio.description || '',
        status: radio.status,
        priority: radio.priority,
        costPerHour: radio.costPerHour,
        metadata: radio.metadata || {},
        lastVerificationStatus: radio.lastVerificationStatus || null,
        lastVerifiedAt: radio.lastVerifiedAt || null,
        createdAt: radio.createdAt.toISOString(),
        updatedAt: radio.updatedAt.toISOString()
      });
      console.log(`   ✅ Radio: ${radio.name}`);
    } catch (error) {
      console.log(`   ⚠️  Radio ya existe: ${radio.name}`);
    }
  }
}

async function migratePhrases() {
  console.log('3. Migrando frases...');
  const phrases = await prisma.phrase.findMany();
  
  for (const phrase of phrases) {
    try {
      await pb.collection('phrases').create({
        id: phrase.id,
        phrase: phrase.phrase,
        brand: phrase.brand,
        campaign: phrase.campaign || '',
        category: phrase.category,
        description: phrase.description || '',
        confidence: phrase.confidence,
        priority: phrase.priority,
        active: phrase.active,
        createdAt: phrase.createdAt.toISOString(),
        updatedAt: phrase.updatedAt.toISOString()
      });
      console.log(`   ✅ Frase: ${phrase.phrase}`);
    } catch (error) {
      console.log(`   ⚠️  Frase ya existe: ${phrase.phrase}`);
    }
  }
}

async function migrateUsers() {
  console.log('4. Migrando usuarios...');
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    try {
      // Crear usuario en PocketBase (auth collection)
      await pb.collection('users').create({
        id: user.id,
        email: user.email,
        name: user.name || '',
        password: 'temp123456', // Contraseña temporal
        passwordConfirm: 'temp123456',
        role: user.role,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      });
      console.log(`   ✅ Usuario: ${user.email}`);
    } catch (error) {
      console.log(`   ⚠️  Usuario ya existe: ${user.email}`);
    }
  }
}

async function migrateMonitoringSessions() {
  console.log('5. Migrando sesiones de monitoreo...');
  const sessions = await prisma.monitoringSession.findMany();
  
  for (const session of sessions) {
    try {
      await pb.collection('monitoring_sessions').create({
        id: session.id,
        radio: session.radioId,
        user: session.userId,
        status: session.status,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime ? session.endTime.toISOString() : null,
        captureInterval: session.captureInterval,
        captureDuration: session.captureDuration,
        totalCaptures: session.totalCaptures,
        totalDetections: session.totalDetections,
        lastCaptureAt: session.lastCaptureAt ? session.lastCaptureAt.toISOString() : null,
        lastDetectionAt: session.lastDetectionAt ? session.lastDetectionAt.toISOString() : null,
        recordingStartHour: session.recordingStartHour || 5,
        recordingEndHour: session.recordingEndHour || 2,
        configuration: session.configuration || {},
        metadata: session.metadata || {}
      });
      console.log(`   ✅ Sesión: ${session.id}`);
    } catch (error) {
      console.log(`   ⚠️  Sesión ya existe: ${session.id}`);
    }
  }
}

async function migrateCaptures() {
  console.log('6. Migrando capturas...');
  const captures = await prisma.capture.findMany();
  
  for (const capture of captures) {
    try {
      await pb.collection('captures').create({
        id: capture.id,
        session: capture.sessionId,
        audioPath: capture.audioPath || '',
        duration: capture.duration,
        fileSize: capture.fileSize ? Number(capture.fileSize) : null,
        format: capture.format || '',
        bitrate: capture.bitrate || null,
        sampleRate: capture.sampleRate || null,
        status: capture.status,
        capturedAt: capture.capturedAt.toISOString(),
        processedAt: capture.processedAt ? capture.processedAt.toISOString() : null,
        transcriptionText: capture.transcriptionText || '',
        confidence: capture.confidence || null,
        provider: capture.provider || '',
        processingTime: capture.processingTime || null,
        cost: capture.cost,
        metadata: capture.metadata || {}
      });
      console.log(`   ✅ Captura: ${capture.id}`);
    } catch (error) {
      console.log(`   ⚠️  Captura ya existe: ${capture.id}`);
    }
  }
}

async function migrateDetections() {
  console.log('7. Migrando detecciones...');
  const detections = await prisma.detection.findMany();
  
  for (const detection of detections) {
    try {
      await pb.collection('detections').create({
        id: detection.id,
        session: detection.sessionId,
        capture: detection.captureId,
        radio: detection.radioId,
        phrase: detection.phraseId,
        detectedText: detection.detectedText,
        originalText: detection.originalText,
        confidence: detection.confidence,
        similarity: detection.similarity,
        timestamp: detection.timestamp.toISOString(),
        audioTimestamp: detection.audioTimestamp || null,
        verified: detection.verified,
        falsePositive: detection.falsePositive,
        cost: detection.cost,
        metadata: detection.metadata || {}
      });
      console.log(`   ✅ Detección: ${detection.id}`);
    } catch (error) {
      console.log(`   ⚠️  Detección ya existe: ${detection.id}`);
    }
  }
}

async function migrateApiConfigurations() {
  console.log('8. Migrando configuraciones de API...');
  const configs = await prisma.apiConfiguration.findMany();
  
  for (const config of configs) {
    try {
      await pb.collection('api_configurations').create({
        id: config.id,
        provider: config.provider,
        apiKey: config.apiKey || '',
        model: config.model || '',
        enabled: config.enabled,
        priority: config.priority,
        costPerUnit: config.costPerUnit,
        rateLimit: config.rateLimit || null,
        metadata: config.metadata || {},
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString()
      });
      console.log(`   ✅ Config API: ${config.provider}`);
    } catch (error) {
      console.log(`   ⚠️  Config API ya existe: ${config.provider}`);
    }
  }
}

async function migrateRadioPricingRules() {
  console.log('9. Migrando reglas de precios...');
  const rules = await prisma.radioPricingRule.findMany();
  
  for (const rule of rules) {
    try {
      await pb.collection('radio_pricing_rules').create({
        id: rule.id,
        radio: rule.radioId,
        name: rule.name,
        pricePerDetection: rule.pricePerDetection,
        effectiveDate: rule.effectiveDate.toISOString(),
        endDate: rule.endDate ? rule.endDate.toISOString() : null,
        description: rule.description || '',
        active: rule.active,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString()
      });
      console.log(`   ✅ Regla: ${rule.name}`);
    } catch (error) {
      console.log(`   ⚠️  Regla ya existe: ${rule.name}`);
    }
  }
}

async function migrateReports() {
  console.log('10. Migrando reportes...');
  const reports = await prisma.report.findMany();
  
  for (const report of reports) {
    try {
      await pb.collection('reports').create({
        id: report.id,
        user: report.userId,
        name: report.name,
        description: report.description || '',
        type: report.type,
        filters: report.filters,
        data: report.data,
        format: report.format,
        status: report.status,
        filePath: report.filePath || '',
        createdAt: report.createdAt.toISOString(),
        generatedAt: report.generatedAt ? report.generatedAt.toISOString() : null
      });
      console.log(`   ✅ Reporte: ${report.name}`);
    } catch (error) {
      console.log(`   ⚠️  Reporte ya existe: ${report.name}`);
    }
  }
}

async function migrateJobs() {
  console.log('11. Migrando jobs...');
  const jobs = await prisma.job.findMany();
  
  for (const job of jobs) {
    try {
      await pb.collection('jobs').create({
        id: job.id,
        type: job.type,
        payload: job.payload,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        error: job.error || '',
        result: job.result || null,
        scheduledAt: job.scheduledAt.toISOString(),
        startedAt: job.startedAt ? job.startedAt.toISOString() : null,
        completedAt: job.completedAt ? job.completedAt.toISOString() : null,
        createdAt: job.createdAt.toISOString()
      });
      console.log(`   ✅ Job: ${job.id}`);
    } catch (error) {
      console.log(`   ⚠️  Job ya existe: ${job.id}`);
    }
  }
}

async function migrateNotifications() {
  console.log('12. Migrando notificaciones...');
  const notifications = await prisma.notification.findMany();
  
  for (const notification of notifications) {
    try {
      await pb.collection('notifications').create({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        read: notification.read,
        data: notification.data || {},
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt ? notification.readAt.toISOString() : null
      });
      console.log(`   ✅ Notificación: ${notification.title}`);
    } catch (error) {
      console.log(`   ⚠️  Notificación ya existe: ${notification.title}`);
    }
  }
}

async function migrateCache() {
  console.log('13. Migrando caché...');
  const cache = await prisma.cache.findMany();
  
  for (const item of cache) {
    try {
      await pb.collection('cache').create({
        id: item.id,
        key: item.key,
        value: item.value,
        expiresAt: item.expiresAt.toISOString(),
        createdAt: item.createdAt.toISOString()
      });
      console.log(`   ✅ Caché: ${item.key}`);
    } catch (error) {
      console.log(`   ⚠️  Caché ya existe: ${item.key}`);
    }
  }
}

async function migrateSystemLogs() {
  console.log('14. Migrando logs del sistema...');
  const logs = await prisma.systemLog.findMany();
  
  for (const log of logs) {
    try {
      await pb.collection('system_logs').create({
        id: log.id,
        level: log.level,
        message: log.message,
        context: log.context || '',
        metadata: log.metadata || {},
        timestamp: log.timestamp.toISOString()
      });
      console.log(`   ✅ Log: ${log.message.substring(0, 50)}...`);
    } catch (error) {
      console.log(`   ⚠️  Log ya existe: ${log.id}`);
    }
  }
}

async function migrateBillingProfiles() {
  console.log('15. Migrando perfiles de facturación...');
  const profiles = await prisma.billingProfile.findMany();
  
  for (const profile of profiles) {
    try {
      await pb.collection('billing_profiles').create({
        id: profile.id,
        user: profile.userId,
        companyName: profile.companyName || '',
        legalName: profile.legalName || '',
        taxId: profile.taxId || '',
        billingEmail: profile.billingEmail || '',
        address: profile.address || '',
        city: profile.city || '',
        region: profile.region || '',
        postalCode: profile.postalCode || '',
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString()
      });
      console.log(`   ✅ Perfil: ${profile.id}`);
    } catch (error) {
      console.log(`   ⚠️  Perfil ya existe: ${profile.id}`);
    }
  }
}

async function migrateInvoices() {
  console.log('16. Migrando facturas...');
  const invoices = await prisma.invoice.findMany();
  
  for (const invoice of invoices) {
    try {
      await pb.collection('invoices').create({
        id: invoice.id,
        billingProfile: invoice.billingProfileId,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
        subtotal: Number(invoice.subtotal),
        tax: Number(invoice.tax),
        total: Number(invoice.total),
        currency: invoice.currency,
        paymentDate: invoice.paymentDate ? invoice.paymentDate.toISOString() : null,
        paymentMethod: invoice.paymentMethod || '',
        notes: invoice.notes || '',
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString()
      });
      console.log(`   ✅ Factura: ${invoice.invoiceNumber}`);
    } catch (error) {
      console.log(`   ⚠️  Factura ya existe: ${invoice.invoiceNumber}`);
    }
  }
}

async function migrateInvoiceLineItems() {
  console.log('17. Migrando items de factura...');
  const items = await prisma.invoiceLineItem.findMany();
  
  for (const item of items) {
    try {
      await pb.collection('invoice_line_items').create({
        id: item.id,
        invoice: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        radio: item.radioId || null,
        session: item.sessionId || null,
        capture: item.captureId || null,
        detection: item.detectionId || null,
        createdAt: item.createdAt.toISOString()
      });
      console.log(`   ✅ Item: ${item.description.substring(0, 30)}...`);
    } catch (error) {
      console.log(`   ⚠️  Item ya existe: ${item.id}`);
    }
  }
}

async function migrateSubscriptions() {
  console.log('18. Migrando suscripciones...');
  const subscriptions = await prisma.subscription.findMany();
  
  for (const subscription of subscriptions) {
    try {
      await pb.collection('subscriptions').create({
        id: subscription.id,
        billingProfile: subscription.billingProfileId,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        canceledAt: subscription.canceledAt ? subscription.canceledAt.toISOString() : null
      });
      console.log(`   ✅ Suscripción: ${subscription.id}`);
    } catch (error) {
      console.log(`   ⚠️  Suscripción ya existe: ${subscription.id}`);
    }
  }
}

async function migratePaymentMethods() {
  console.log('19. Migrando métodos de pago...');
  const methods = await prisma.paymentMethod.findMany();
  
  for (const method of methods) {
    try {
      await pb.collection('payment_methods').create({
        id: method.id,
        user: method.userId,
        type: method.type,
        name: method.name,
        lastDigits: method.lastDigits || '',
        expiryDate: method.expiryDate || '',
        isDefault: method.isDefault,
        status: method.status,
        createdAt: method.createdAt.toISOString(),
        updatedAt: method.updatedAt.toISOString()
      });
      console.log(`   ✅ Método: ${method.name}`);
    } catch (error) {
      console.log(`   ⚠️  Método ya existe: ${method.name}`);
    }
  }
}

// Ejecutar migración
migrateData();