const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllRadios() {
  try {
    console.log('🗑️ Iniciando eliminación de todas las radios...');
    
    // Primero eliminamos las relaciones dependientes
    console.log('📡 Eliminando sesiones de monitoreo...');
    const deletedSessions = await prisma.monitoringSession.deleteMany({});
    console.log(`✅ Eliminadas ${deletedSessions.count} sesiones de monitoreo`);
    
    console.log('🔍 Eliminando detecciones...');
    const deletedDetections = await prisma.detection.deleteMany({});
    console.log(`✅ Eliminadas ${deletedDetections.count} detecciones`);
    
    console.log('💰 Eliminando reglas de precios...');
    const deletedPricingRules = await prisma.radioPricingRule.deleteMany({});
    console.log(`✅ Eliminadas ${deletedPricingRules.count} reglas de precios`);
    
    // Finalmente eliminamos las radios
    console.log('📻 Eliminando todas las radios...');
    const deletedRadios = await prisma.radio.deleteMany({});
    console.log(`✅ Eliminadas ${deletedRadios.count} radios`);
    
    console.log('🎉 ¡Todas las radios han sido eliminadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al eliminar las radios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
deleteAllRadios()
  .then(() => {
    console.log('✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });