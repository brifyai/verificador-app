const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRegions() {
  try {
    // Obtener todas las regiones únicas
    const regions = await prisma.radio.findMany({
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' }
    });
    
    console.log('Regiones únicas en la base de datos:');
    regions.forEach((radio, index) => {
      console.log(`${index + 1}. '${radio.region}'`);
    });
    
    // Contar cuántas radios hay por región
    const regionCounts = await prisma.radio.groupBy({
      by: ['region'],
      _count: { region: true },
      orderBy: { region: 'asc' }
    });
    
    console.log('\nCantidad de radios por región:');
    regionCounts.forEach(item => {
      console.log(`${item.region}: ${item._count.region} radios`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegions();