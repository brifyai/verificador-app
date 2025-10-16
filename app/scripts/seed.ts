
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Limpiar datos relacionados para evitar conflictos en upserts
  console.log('🧹 Cleaning related data...');
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.phraseVariant.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.radioPricingRule.deleteMany();
  console.log('✅ Related data cleaned');

  // 1. Crear usuarios de ejemplo
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@radiomonitor.cl' },
    update: {},
    create: {
      email: 'admin@radiomonitor.cl',
      name: 'Administrador Sistema',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'monitor@radiomonitor.cl' },
    update: {},
    create: {
      email: 'monitor@radiomonitor.cl',
      name: 'Monitor Principal',
      password: hashedPassword,
      role: 'USER',
    }
  });

  console.log('✅ Users created');

  // 2. Crear radios de ejemplo con URLs reales de Chile
  const radios = await Promise.all([
    prisma.radio.upsert({
      where: { id: 'radio_cooperativa' },
      update: {},
      create: {
        id: 'radio_cooperativa',
        name: 'Radio Cooperativa',
        streamUrl: 'https://mdstrm.com/audio/5dc2c4a5e4fa1c0c02deb012/icecast.audio',
        platform: 'HTTP_STREAM',
        region: 'Santiago',
        description: 'Radio Cooperativa - Noticias y actualidad',
        priority: 1,
        costPerHour: 50.0
      }
    }),
    prisma.radio.upsert({
      where: { id: 'radio_biobio' },
      update: {},
      create: {
        id: 'radio_biobio',
        name: 'Radio Bío Bío',
        streamUrl: 'https://unlimited6-cl.dps.live/biobiofm/aac/icecast.audio',
        platform: 'HTTP_STREAM',
        region: 'Santiago',
        description: 'Radio Bío Bío - Música y entretenimiento',
        priority: 1,
        costPerHour: 45.0
      }
    }),
    prisma.radio.upsert({
      where: { id: 'radio_duna' },
      update: {},
      create: {
        id: 'radio_duna',
        name: 'Radio Duna',
        streamUrl: 'https://unlimited6-cl.dps.live/dunastreaming/aac/icecast.audio',
        platform: 'HTTP_STREAM',
        region: 'Santiago',
        description: 'Radio Duna - Noticias y análisis',
        priority: 1,
        costPerHour: 55.0
      }
    }),
    prisma.radio.upsert({
      where: { id: 'radio_pudahuel' },
      update: {},
      create: {
        id: 'radio_pudahuel',
        name: 'Radio Pudahuel',
        streamUrl: 'https://sonic.portalfoxmix.cl/8040/stream',
        platform: 'HTTP_STREAM',
        region: 'Santiago',
        description: 'Radio Pudahuel - Música y programación local',
        priority: 2,
        costPerHour: 35.0
      }
    }),
    prisma.radio.upsert({
      where: { id: 'radio_futuro' },
      update: {},
      create: {
        id: 'radio_futuro',
        name: 'Futuro 88.9',
        streamUrl: 'https://mdstrm.com/audio/5dc2c4a5e4fa1c0c02deb013/icecast.audio',
        platform: 'HTTP_STREAM',
        region: 'Santiago',
        description: 'Futuro 88.9 - Rock y música alternativa',
        priority: 2,
        costPerHour: 40.0
      }
    })
  ]);

  console.log('✅ Radios created');

  // 3. Crear frases publicitarias de ejemplo
  const phrases = await Promise.all([
    prisma.phrase.upsert({
      where: { id: 'phrase_falabella' },
      update: {},
      create: {
        id: 'phrase_falabella',
        phrase: 'Falabella descuentos especiales hasta 50% de descuento',
        brand: 'Falabella',
        campaign: 'Cyber Monday 2025',
        category: 'PROMOTION',
        description: 'Promoción de descuentos en tienda departamental',
        confidence: 0.85,
        priority: 1
      }
    }),
    prisma.phrase.upsert({
      where: { id: 'phrase_wom' },
      update: {},
      create: {
        id: 'phrase_wom',
        phrase: 'WOM iPhone 15 disponible con planes desde 19990 pesos',
        brand: 'WOM',
        campaign: 'Lanzamiento iPhone 15',
        category: 'PRODUCT',
        description: 'Lanzamiento de nuevo modelo de iPhone',
        confidence: 0.9,
        priority: 1
      }
    }),
    prisma.phrase.upsert({
      where: { id: 'phrase_ripley' },
      update: {},
      create: {
        id: 'phrase_ripley',
        phrase: 'Ripley mejores ofertas en electrohogar',
        brand: 'Ripley',
        campaign: 'Ofertas Electrohogar',
        category: 'PROMOTION',
        description: 'Promoción de productos para el hogar',
        confidence: 0.8,
        priority: 2
      }
    }),
    prisma.phrase.upsert({
      where: { id: 'phrase_paris' },
      update: {},
      create: {
        id: 'phrase_paris',
        phrase: 'Paris liquidación total hasta agotar stock',
        brand: 'Paris',
        campaign: 'Liquidación Total',
        category: 'PROMOTION',
        description: 'Liquidación de temporada',
        confidence: 0.85,
        priority: 1
      }
    }),
    prisma.phrase.upsert({
      where: { id: 'phrase_lider' },
      update: {},
      create: {
        id: 'phrase_lider',
        phrase: 'Lider precios bajos siempre',
        brand: 'Lider',
        campaign: 'Precios Bajos Siempre',
        category: 'BRAND',
        description: 'Campaña institucional de marca',
        confidence: 0.9,
        priority: 1
      }
    })
  ]);

  console.log('✅ Phrases created');

  // 4. Crear variantes de frases para mejor detección
  const phraseVariants = await Promise.all([
    prisma.phraseVariant.create({
      data: {
        phraseId: 'phrase_falabella',
        variant: 'descuentos Falabella hasta 50 por ciento',
        similarity: 0.8
      }
    }),
    prisma.phraseVariant.create({
      data: {
        phraseId: 'phrase_falabella',
        variant: 'Falabella ofertas especiales medio precio',
        similarity: 0.75
      }
    }),
    prisma.phraseVariant.create({
      data: {
        phraseId: 'phrase_wom',
        variant: 'WOM nuevo iPhone quince planes diecinueve mil novecientos noventa',
        similarity: 0.85
      }
    }),
    prisma.phraseVariant.create({
      data: {
        phraseId: 'phrase_lider',
        variant: 'Lider siempre precios bajos',
        similarity: 0.9
      }
    })
  ]);

  console.log('✅ Phrase variants created');

  // 5. Crear configuración de APIs (sin claves reales)
  const apiConfigs = await Promise.all([
    prisma.apiConfiguration.upsert({
      where: { provider: 'abacus' },
      update: {},
      create: {
        provider: 'abacus',
        model: 'gpt-4o',
        enabled: false,
        priority: 1,
        costPerUnit: 0.03,
        rateLimit: 60,
        metadata: {
          baseUrl: 'https://api.abacus.ai/v1',
          supportedModels: ['gpt-4o', 'gpt-3.5-turbo', 'claude-3-sonnet'],
          audioFormats: ['mp3', 'wav', 'ogg', 'm4a']
        }
      }
    }),
    prisma.apiConfiguration.upsert({
      where: { provider: 'groq' },
      update: {},
      create: {
        provider: 'groq',
        model: 'whisper-large-v3',
        enabled: false,
        priority: 2,
        costPerUnit: 0.006,
        rateLimit: 30,
        metadata: {
          baseUrl: 'https://api.groq.com/openai/v1',
          supportedModels: ['whisper-large-v3', 'distil-whisper-large-v3-en'],
          audioFormats: ['mp3', 'wav', 'ogg', 'm4a', 'webm']
        }
      }
    }),
    prisma.apiConfiguration.upsert({
      where: { provider: 'openai' },
      update: {},
      create: {
        provider: 'openai',
        model: 'whisper-1',
        enabled: false,
        priority: 3,
        costPerUnit: 0.012,
        rateLimit: 50,
        metadata: {
          baseUrl: 'https://api.openai.com/v1',
          supportedModels: ['whisper-1'],
          audioFormats: ['mp3', 'wav', 'ogg', 'm4a', 'webm']
        }
      }
    }),
    prisma.apiConfiguration.upsert({
      where: { provider: 'deepgram' },
      update: {},
      create: {
        provider: 'deepgram',
        model: 'nova-2-general',
        enabled: false,
        priority: 4,
        costPerUnit: 0.0043,
        rateLimit: 100,
        metadata: {
          baseUrl: 'https://api.deepgram.com/v1',
          supportedModels: ['nova-2-general', 'nova-2-meeting', 'enhanced-general'],
          audioFormats: ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'flac']
        }
      }
    })
  ]);

  console.log('✅ API configurations created');

  // 6. Crear reglas de precios por radio
  const pricingRules = await Promise.all([
    prisma.radioPricingRule.create({
      data: {
        radioId: 'radio_cooperativa',
        name: 'Tier Premium',
        pricePerDetection: 1200.0,
        description: 'Radio de alta audiencia - precio premium',
        effectiveDate: new Date('2025-09-01')
      }
    }),
    prisma.radioPricingRule.create({
      data: {
        radioId: 'radio_biobio',
        name: 'Tier Premium',
        pricePerDetection: 1100.0,
        description: 'Radio de alta audiencia - precio premium',
        effectiveDate: new Date('2025-09-01')
      }
    }),
    prisma.radioPricingRule.create({
      data: {
        radioId: 'radio_duna',
        name: 'Tier Premium',
        pricePerDetection: 1000.0,
        description: 'Radio de alta audiencia - precio premium',
        effectiveDate: new Date('2025-09-01')
      }
    }),
    prisma.radioPricingRule.create({
      data: {
        radioId: 'radio_pudahuel',
        name: 'Tier Standard',
        pricePerDetection: 800.0,
        description: 'Radio regional - precio estándar',
        effectiveDate: new Date('2025-09-01')
      }
    }),
    prisma.radioPricingRule.create({
      data: {
        radioId: 'radio_futuro',
        name: 'Tier Standard',
        pricePerDetection: 750.0,
        description: 'Radio especializada - precio estándar',
        effectiveDate: new Date('2025-09-01')
      }
    })
  ]);

  console.log('✅ Pricing rules created');

  // 7. Crear algunas notificaciones del sistema
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        title: 'Sistema Inicializado',
        message: 'El sistema de monitoreo ha sido configurado exitosamente. Puede comenzar a agregar sus API keys.',
        type: 'SYSTEM',
        priority: 'MEDIUM',
        data: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    }),
    prisma.notification.create({
      data: {
        title: 'Configuración Requerida',
        message: 'Para comenzar el monitoreo, configure al menos una API de transcripción en la sección Configuración.',
        type: 'INFO',
        priority: 'HIGH',
        data: {
          action: 'configure_apis',
          url: '/configuracion'
        }
      }
    }),
    prisma.notification.create({
      data: {
        title: 'Base de Datos Lista',
        message: 'La base de datos ha sido poblada con datos de ejemplo. Sistema listo para operación.',
        type: 'INFO',
        priority: 'LOW',
        data: {
          radios_count: radios.length,
          phrases_count: phrases.length,
          users_count: 2
        }
      }
    })
  ]);

  console.log('✅ Notifications created');

  // 8. Crear perfiles de facturación de ejemplo
  const billingProfile1 = await prisma.billingProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      companyName: 'Empresa Demo S.A.',
      legalName: 'Empresa Demo Sociedad Anónima',
      taxId: '12.345.678-9',
      billingEmail: 'facturacion@empresademo.cl',
      address: 'Av. Providencia 1234, Santiago',
      city: 'Santiago',
      region: 'Región Metropolitana',
      postalCode: '7500000'
    }
  });

  const billingProfile2 = await prisma.billingProfile.upsert({
    where: { userId: regularUser.id },
    update: {},
    create: {
      userId: regularUser.id,
      companyName: 'Monitor Pro Ltda.',
      legalName: 'Monitor Pro Limitada',
      taxId: '98.765.432-1',
      billingEmail: 'admin@monitorpro.cl',
      address: 'Las Condes 5678, Santiago',
      city: 'Santiago',
      region: 'Región Metropolitana',
      postalCode: '7550000'
    }
  });

  const billingProfiles = [billingProfile1, billingProfile2];

  console.log('✅ Billing profiles created');

  // 9. Crear suscripciones de ejemplo
  const subscription1 = await prisma.subscription.upsert({
    where: { billingProfileId: billingProfiles[0].id },
    update: {},
    create: {
      billingProfileId: billingProfiles[0].id,
      planId: "plan_pro_mensual",
      status: "ACTIVE",
      currentPeriodStart: new Date("2024-01-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2024-10-01T00:00:00.000Z")
    }
  });

  const subscription2 = await prisma.subscription.upsert({
    where: { billingProfileId: billingProfiles[1].id },
    update: {},
    create: {
      billingProfileId: billingProfiles[1].id,
      planId: "plan_enterprise_mensual",
      status: "ACTIVE",
      currentPeriodStart: new Date("2024-02-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2024-11-01T00:00:00.000Z")
    }
  });

  const subscriptions = [subscription1, subscription2];

  console.log('✅ Subscriptions created');

  // 10. Crear facturas de ejemplo
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2024-001' },
    update: {},
    create: {
      billingProfileId: billingProfiles[0].id,
      invoiceNumber: 'INV-2024-001',
      issueDate: new Date('2024-09-01'),
      dueDate: new Date('2024-09-30'),
      status: 'PAID',
      subtotal: 76262,
      tax: 14498,
      total: 89990,
      currency: 'CLP',
      paymentDate: new Date('2024-09-05'),
      paymentMethod: 'Visa **** 4532',
      notes: 'Pago procesado automáticamente'
    }
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2024-002' },
    update: {},
    create: {
      billingProfileId: billingProfiles[1].id,
      invoiceNumber: 'INV-2024-002',
      issueDate: new Date('2024-09-15'),
      dueDate: new Date('2024-10-15'),
      status: 'PENDING',
      subtotal: 25412,
      tax: 4831,
      total: 29990,
      currency: 'CLP',
      notes: 'Pendiente de pago por transferencia bancaria'
    }
  });

  const invoices = [invoice1, invoice2];

  console.log('✅ Invoices created');

  // 11. Crear líneas de factura de ejemplo
  const invoiceLineItems = await Promise.all([
    // Líneas para la primera factura
    prisma.invoiceLineItem.create({
      data: {
        invoiceId: invoices[0].id,
        description: 'Plan Profesional - Septiembre 2024',
        quantity: 1,
        unitPrice: 89990,
        total: 89990,
        radioId: radios[0].id
      }
    }),
    // Líneas para la segunda factura
    prisma.invoiceLineItem.create({
      data: {
        invoiceId: invoices[1].id,
        description: 'Plan Básico - Septiembre 2024',
        quantity: 1,
        unitPrice: 29990,
        total: 29990,
        radioId: radios[1].id
      }
    })
  ]);

  console.log('✅ Invoice line items created');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 2`);
  console.log(`- Radios: ${radios.length}`);
  console.log(`- Phrases: ${phrases.length}`);
  console.log(`- Phrase Variants: ${phraseVariants.length}`);
  console.log(`- API Configurations: ${apiConfigs.length}`);
  console.log(`- Pricing Rules: ${pricingRules.length}`);
  console.log(`- Notifications: ${notifications.length}`);
  console.log(`- Billing Profiles: ${billingProfiles.length}`);
  console.log(`- Subscriptions: ${subscriptions.length}`);
  console.log(`- Invoices: ${invoices.length}`);
  console.log(`- Invoice Line Items: ${invoiceLineItems.length}`);
  
  console.log('\n🔑 Default login credentials:');
  console.log('Email: admin@radiomonitor.cl');
  console.log('Password: admin123\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
