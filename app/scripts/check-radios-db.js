// Script para verificar radios en la base de datos usando Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRadiosInDB() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    // Obtener todas las radios
    const radios = await prisma.radio.findMany({
      select: {
        id: true,
        name: true,
        streamUrl: true,
        region: true,
        metadata: true,
        active: true
      }
    });

    console.log(`\n📻 Encontradas ${radios.length} radios en la base de datos`);
    console.log('='.repeat(60));

    if (radios.length === 0) {
      console.log('❌ No hay radios en la base de datos');
      console.log('\n💡 Para agregar radios de prueba, ejecuta:');
      console.log('   npx prisma db seed');
      return;
    }

    // Analizar cada radio
    const radioAnalysis = radios.map((radio, index) => {
      let actualStreamUrl = radio.streamUrl;
      let urlSource = 'streamUrl';
      
      // Si no hay streamUrl directo, buscar en metadata
      if (!actualStreamUrl && radio.metadata && typeof radio.metadata === 'object') {
        const metadata = radio.metadata;
        
        // Buscar en platformData
        if (metadata.platformData && metadata.platformData.url) {
          actualStreamUrl = metadata.platformData.url.replace(/`/g, '').trim();
          urlSource = 'metadata.platformData.url';
        }
        // Buscar en otros campos posibles
        else if (metadata.url) {
          actualStreamUrl = metadata.url.replace(/`/g, '').trim();
          urlSource = 'metadata.url';
        }
        else if (metadata.stream_url) {
          actualStreamUrl = metadata.stream_url.replace(/`/g, '').trim();
          urlSource = 'metadata.stream_url';
        }
      }
      
      const status = {
        index: index + 1,
        id: radio.id,
        name: radio.name,
        region: radio.region,
        active: radio.active,
        streamUrl: actualStreamUrl,
        urlSource: urlSource,
        hasValidUrl: !!actualStreamUrl,
        ready: radio.active && !!actualStreamUrl
      };

      // Mostrar información de la radio
      console.log(`${status.index}. 📻 ${radio.name}`);
      console.log(`   🆔 ID: ${radio.id}`);
      console.log(`   📍 Región: ${radio.region || 'No especificada'}`);
      console.log(`   🔄 Estado: ${radio.active ? '✅ Activa' : '❌ Inactiva'}`);
      console.log(`   🔗 Stream URL: ${actualStreamUrl || '❌ No configurada'}`);
      if (actualStreamUrl) {
        console.log(`   📄 Fuente URL: ${urlSource}`);
      }
      console.log(`   🎯 Lista para monitoreo: ${status.ready ? '✅ Sí' : '❌ No'}`);
      
      if (radio.metadata && Object.keys(radio.metadata).length > 0) {
        console.log(`   📋 Metadata: ${JSON.stringify(radio.metadata, null, 2).substring(0, 100)}...`);
      }
      
      console.log('');
      
      return status;
    });

    // Estadísticas
    const stats = {
      total: radios.length,
      active: radioAnalysis.filter(r => r.active).length,
      withUrl: radioAnalysis.filter(r => r.hasValidUrl).length,
      ready: radioAnalysis.filter(r => r.ready).length
    };

    console.log('📊 RESUMEN:');
    console.log('='.repeat(60));
    console.log(`📻 Total de radios: ${stats.total}`);
    console.log(`✅ Radios activas: ${stats.active}`);
    console.log(`🔗 Con URL válida: ${stats.withUrl}`);
    console.log(`🎯 Listas para monitoreo: ${stats.ready}`);

    // Radios listas para usar
    const readyRadios = radioAnalysis.filter(r => r.ready);
    if (readyRadios.length > 0) {
      console.log('\n✅ RADIOS LISTAS PARA MONITOREO:');
      console.log('='.repeat(60));
      readyRadios.forEach(radio => {
        console.log(`   📻 ${radio.name} (ID: ${radio.id})`);
      });
      
      // Generar ejemplo de uso
      console.log('\n🧪 EJEMPLO PARA EL DASHBOARD:');
      console.log('='.repeat(60));
      console.log('Puedes usar estos IDs en el dashboard:');
      console.log(`radioIds: [${readyRadios.slice(0, 3).map(r => `"${r.id}"`).join(', ')}]`);
    }

    // Problemas encontrados
    const problems = radioAnalysis.filter(r => !r.ready);
    if (problems.length > 0) {
      console.log('\n⚠️ RADIOS CON PROBLEMAS:');
      console.log('='.repeat(60));
      problems.forEach(radio => {
        const issues = [];
        if (!radio.active) issues.push('Inactiva');
        if (!radio.hasValidUrl) issues.push('Sin URL de stream');
        
        console.log(`   ❌ ${radio.name} (ID: ${radio.id})`);
        console.log(`      Problemas: ${issues.join(', ')}`);
      });
    }

    // Verificar frases también
    console.log('\n🔍 Verificando frases disponibles...');
    const phrases = await prisma.phrase.findMany({
      where: { active: true },
      select: {
        id: true,
        phrase: true,
        brand: true,
        active: true
      },
      take: 5
    });

    if (phrases.length > 0) {
      console.log(`✅ Encontradas ${phrases.length} frases activas:`);
      phrases.forEach(phrase => {
        console.log(`   🔍 "${phrase.phrase}" - ${phrase.brand} (ID: ${phrase.id})`);
      });
    } else {
      console.log('❌ No hay frases activas en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   - Verifica que la base de datos esté corriendo');
    console.log('   - Ejecuta: npx prisma generate');
    console.log('   - Ejecuta: npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
checkRadiosInDB();
