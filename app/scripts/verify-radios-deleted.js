const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyRadiosDeleted() {
  try {
    console.log('🔍 Verificando que las radios fueron eliminadas...');
    
    // Contar radios restantes
    const radioCount = await prisma.radio.count();
    console.log(`📻 Radios en la base de datos: ${radioCount}`);
    
    // Contar sesiones de monitoreo restantes
    const sessionCount = await prisma.monitoringSession.count();
    console.log(`📡 Sesiones de monitoreo: ${sessionCount}`);
    
    // Contar detecciones restantes
    const detectionCount = await prisma.detection.count();
    console.log(`🔍 Detecciones: ${detectionCount}`);
    
    // Contar reglas de precios restantes
    const pricingRuleCount = await prisma.radioPricingRule.count();
    console.log(`💰 Reglas de precios: ${pricingRuleCount}`);
    
    if (radioCount === 0 && sessionCount === 0 && detectionCount === 0 && pricingRuleCount === 0) {
      console.log('✅ ¡Verificación exitosa! Todas las radios y datos relacionados han sido eliminados.');
    } else {
      console.log('⚠️ Advertencia: Aún quedan algunos datos en la base de datos.');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verifyRadiosDeleted()
  .then(() => {
    console.log('✨ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la verificación:', error);
    process.exit(1);
  });