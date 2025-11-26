import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function createCollectionsWithData() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  // Autenticar con API Key
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🚀 Creando colecciones en PocketBase con datos...\n');
  
  try {
    // 1. Crear colección radios
    console.log('📻 Creando colección radios...');
    await pb.collections.create({
      name: 'radios',
      type: 'base',
      schema: [
        {
          name: 'name',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 200
          }
        },
        {
          name: 'url',
          type: 'url',
          required: true,
          options: {}
        },
        {
          name: 'region',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100
          }
        },
        {
          name: 'city',
          type: 'text',
          required: false,
          options: {
            min: 1,
            max: 100
          }
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['active', 'inactive', 'maintenance']
          }
        },
        {
          name: 'format',
          type: 'text',
          required: false,
          options: {
            min: 1,
            max: 100
          }
        },
        {
          name: 'frequency',
          type: 'text',
          required: false,
          options: {
            min: 1,
            max: 50
          }
        },
        {
          name: 'coverage',
          type: 'select',
          required: false,
          options: {
            values: ['local', 'regional', 'national']
          }
        },
        {
          name: 'reliability',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: 100
          }
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
          options: {
            max: 500
          }
        }
      ]
    });
    console.log('✅ Colección radios creada');

    // 2. Crear colección phrases
    console.log('🎯 Creando colección phrases...');
    await pb.collections.create({
      name: 'phrases',
      type: 'base',
      schema: [
        {
          name: 'phrase',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 500
          }
        },
        {
          name: 'brand',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100
          }
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          options: {
            values: ['retail', 'supermarket', 'financial', 'promotions', 'automotive', 'telecom', 'services']
          }
        },
        {
          name: 'active',
          type: 'bool',
          required: true,
          options: {}
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          options: {
            values: ['high', 'medium', 'low']
          }
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
          options: {
            max: 500
          }
        }
      ]
    });
    console.log('✅ Colección phrases creada');

    // 3. Crear colección detections
    console.log('🔍 Creando colección detections...');
    await pb.collections.create({
      name: 'detections',
      type: 'base',
      schema: [
        {
          name: 'radio',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'radios',
            maxSelect: 1
          }
        },
        {
          name: 'phrase',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'phrases',
            maxSelect: 1
          }
        },
        {
          name: 'timestamp',
          type: 'datetime',
          required: true,
          options: {}
        },
        {
          name: 'confidence',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'verified',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          name: 'correct',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          name: 'cost',
          type: 'number',
          required: false,
          options: {
            min: 0
          }
        },
        {
          name: 'audio_url',
          type: 'url',
          required: false,
          options: {}
        },
        {
          name: 'transcript',
          type: 'text',
          required: false,
          options: {
            max: 2000
          }
        }
      ]
    });
    console.log('✅ Colección detections creada');

    // 4. Crear colección captures
    console.log('🎙️ Creando colección captures...');
    await pb.collections.create({
      name: 'captures',
      type: 'base',
      schema: [
        {
          name: 'radio',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'radios',
            maxSelect: 1
          }
        },
        {
          name: 'capturedAt',
          type: 'datetime',
          required: true,
          options: {}
        },
        {
          name: 'duration',
          type: 'number',
          required: true,
          options: {
            min: 0
          }
        },
        {
          name: 'file_url',
          type: 'url',
          required: true,
          options: {}
        },
        {
          name: 'file_size',
          type: 'number',
          required: true,
          options: {
            min: 0
          }
        },
        {
          name: 'cost',
          type: 'number',
          required: false,
          options: {
            min: 0
          }
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['processing', 'completed', 'failed']
          }
        }
      ]
    });
    console.log('✅ Colección captures creada');

    // 5. Insertar datos de radios
    console.log('\n📻 Insertando datos de radios...');
    const radiosData = [
      {
        name: "Radio Bio-Bio Concepción",
        url: "https://unlimited1-cl-isp.dps.live/radiobiobioconcepcion/aac/icecast.audio",
        region: "Concepción",
        city: "Concepción",
        status: "active",
        format: "News/Talk",
        frequency: "90.1 FM",
        coverage: "regional",
        reliability: 95,
        notes: "Principal emisora de la región del Biobío"
      },
      {
        name: "Radio Cooperativa",
        url: "https://unlimited1-cl-isp.dps.live/radiocooperativa/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "News/Talk",
        frequency: "660 AM",
        coverage: "national",
        reliability: 98,
        notes: "Radio noticias nacional, líder en audiencia"
      },
      {
        name: "Radio ADN",
        url: "https://unlimited1-cl-isp.dps.live/radioadn/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "News/Talk",
        frequency: "91.7 FM",
        coverage: "national",
        reliability: 96,
        notes: "Radio juvenil con enfoque en noticias"
      },
      {
        name: "Radio Agricultura",
        url: "https://unlimited1-cl-isp.dps.live/radioagricultura/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "News/Talk",
        frequency: "92.1 FM",
        coverage: "national",
        reliability: 97,
        notes: "Radio histórica de Chile"
      },
      {
        name: "Radio Infinita",
        url: "https://unlimited1-cl-isp.dps.live/radioinfinita/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "Rock/Pop",
        frequency: "100.5 FM",
        coverage: "regional",
        reliability: 94,
        notes: "Radio musical con programación rock"
      },
      {
        name: "Radio Pudahuel",
        url: "https://unlimited1-cl-isp.dps.live/radiopudahuel/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "Adult Contemporary",
        frequency: "90.5 FM",
        coverage: "national",
        reliability: 98,
        notes: "Radio musical adulta contemporánea"
      },
      {
        name: "Radio Carolina",
        url: "https://unlimited1-cl-isp.dps.live/radiocarolina/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "Pop/Top 40",
        frequency: "99.3 FM",
        coverage: "national",
        reliability: 97,
        notes: "Radio juvenil con música pop"
      },
      {
        name: "Radio Rock & Pop",
        url: "https://unlimited1-cl-isp.dps.live/radiorockpop/aac/icecast.audio",
        region: "Santiago",
        city: "Santiago",
        status: "active",
        format: "Rock/Pop",
        frequency: "94.1 FM",
        coverage: "national",
        reliability: 95,
        notes: "Radio rock nacional"
      },
      {
        name: "Radio Imagina",
        url: "https://unlimited1-cl-isp.dps.live/radioimagina/aac/icecast.audio",
        region: "Concepción",
        city: "Concepción",
        status: "active",
        format: "Adult Contemporary",
        frequency: "88.5 FM",
        coverage: "regional",
        reliability: 93,
        notes: "Radio local de Concepción"
      },
      {
        name: "Radio Universidad de Concepción",
        url: "https://unlimited1-cl-isp.dps.live/radioudec/aac/icecast.audio",
        region: "Concepción",
        city: "Concepción",
        status: "active",
        format: "University Radio",
        frequency: "102.5 FM",
        coverage: "regional",
        reliability: 92,
        notes: "Radio universitaria con programación variada"
      }
    ];

    for (const radio of radiosData) {
      try {
        await pb.collection('radios').create(radio);
        console.log(`   ✅ ${radio.name}`);
      } catch (error) {
        console.log(`   ❌ ${radio.name} - ${error.message}`);
      }
    }

    // 6. Insertar datos de frases
    console.log('\n🎯 Insertando datos de frases...');
    const phrasesData = [
      {
        phrase: "precio bajo garantizado",
        brand: "Falabella",
        category: "retail",
        active: true,
        priority: "high",
        notes: "Eslogan principal de Falabella"
      },
      {
        phrase: "do it all",
        brand: "Falabella",
        category: "retail",
        active: true,
        priority: "high",
        notes: "Campaña reciente de Falabella"
      },
      {
        phrase: "la vida es hoy",
        brand: "París",
        category: "retail",
        active: true,
        priority: "high",
        notes: "Eslogan de París"
      },
      {
        phrase: "tienda oficial",
        brand: "París",
        category: "retail",
        active: true,
        priority: "medium",
        notes: "Término común en publicidad"
      },
      {
        phrase: "precios bajos siempre",
        brand: "Líder",
        category: "supermarket",
        active: true,
        priority: "high",
        notes: "Eslogan de Supermercados Líder"
      },
      {
        phrase: "calidad garantizada",
        brand: "Líder",
        category: "supermarket",
        active: true,
        priority: "medium",
        notes: "Término de calidad Líder"
      },
      {
        phrase: "jumbo te da más",
        brand: "Jumbo",
        category: "supermarket",
        active: true,
        priority: "high",
        notes: "Eslogan de Jumbo"
      },
      {
        phrase: "hipermercado",
        brand: "Jumbo",
        category: "supermarket",
        active: true,
        priority: "low",
        notes: "Término genérico pero asociado a Jumbo"
      },
      {
        phrase: "el reloj de la ahorra",
        brand: "La Polar",
        category: "retail",
        active: true,
        priority: "high",
        notes: "Campaña icónica de La Polar"
      },
      {
        phrase: "garantía de satisfacción",
        brand: "Ripley",
        category: "retail",
        active: true,
        priority: "medium",
        notes: "Política de Ripley"
      },
      {
        phrase: "todo en un solo lugar",
        brand: "Ripley",
        category: "retail",
        active: true,
        priority: "medium",
        notes: "Valor de propuesta Ripley"
      },
      {
        phrase: "crédito fácil",
        brand: "Generic",
        category: "financial",
        active: true,
        priority: "low",
        notes: "Término financiero común"
      },
      {
        phrase: "cuotas sin interés",
        brand: "Generic",
        category: "financial",
        active: true,
        priority: "low",
        notes: "Oferta común en retail"
      },
      {
        phrase: "descuento especial",
        brand: "Generic",
        category: "promotions",
        active: true,
        priority: "low",
        notes: "Término promocional genérico"
      },
      {
        phrase: "oferta limitada",
        brand: "Generic",
        category: "promotions",
        active: true,
        priority: "medium",
        notes: "Término de urgencia en publicidad"
      }
    ];

    for (const phrase of phrasesData) {
      try {
        await pb.collection('phrases').create(phrase);
        console.log(`   ✅ ${phrase.phrase} (${phrase.brand})`);
      } catch (error) {
        console.log(`   ❌ ${phrase.phrase} - ${error.message}`);
      }
    }

    // 7. Insertar algunas detecciones de ejemplo
    console.log('\n🔍 Insertando detecciones de ejemplo...');
    
    // Obtener IDs de radios y frases para relaciones
    const radios = await pb.collection('radios').getFullList();
    const phrases = await pb.collection('phrases').getFullList();
    
    if (radios.length > 0 && phrases.length > 0) {
      const sampleDetections = [
        {
          radio: radios[0].id,
          phrase: phrases[0].id,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          confidence: 0.95,
          verified: true,
          correct: true,
          cost: 0.05,
          transcript: "En Falabella tenemos precio bajo garantizado para ti"
        },
        {
          radio: radios[1].id,
          phrase: phrases[2].id,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          confidence: 0.87,
          verified: true,
          correct: true,
          cost: 0.04,
          transcript: "La vida es hoy, disfrútala al máximo"
        },
        {
          radio: radios[2].id,
          phrase: phrases[4].id,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          confidence: 0.92,
          verified: false,
          cost: 0.05,
          transcript: "Precios bajos siempre en Líder"
        },
        {
          radio: radios[3].id,
          phrase: phrases[6].id,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          confidence: 0.89,
          verified: true,
          correct: true,
          cost: 0.04,
          transcript: "Jumbo te da más por tu dinero"
        },
        {
          radio: radios[4].id,
          phrase: phrases[8].id,
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          confidence: 0.94,
          verified: true,
          correct: true,
          cost: 0.05,
          transcript: "El reloj de la ahorra está sonando en La Polar"
        }
      ];

      for (const detection of sampleDetections) {
        try {
          await pb.collection('detections').create(detection);
          console.log(`   ✅ Detección creada - Confianza: ${detection.confidence}`);
        } catch (error) {
          console.log(`   ❌ Error creando detección - ${error.message}`);
        }
      }
    }

    // 8. Insertar algunas capturas de ejemplo
    console.log('\n🎙️ Insertando capturas de ejemplo...');
    
    if (radios.length > 0) {
      const sampleCaptures = [
        {
          radio: radios[0].id,
          capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          file_url: "https://pocket.brifyai.com/api/files/captures/sample1.mp3",
          file_size: 720000,
          cost: 0.03,
          status: "completed"
        },
        {
          radio: radios[1].id,
          capturedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          file_url: "https://pocket.brifyai.com/api/files/captures/sample2.mp3",
          file_size: 1080000,
          cost: 0.05,
          status: "completed"
        },
        {
          radio: radios[2].id,
          capturedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          file_url: "https://pocket.brifyai.com/api/files/captures/sample3.mp3",
          file_size: 1440000,
          cost: 0.06,
          status: "processing"
        }
      ];

      for (const capture of sampleCaptures) {
        try {
          await pb.collection('captures').create(capture);
          console.log(`   ✅ Captura creada - Duración: ${capture.duration}s`);
        } catch (error) {
          console.log(`   ❌ Error creando captura - ${error.message}`);
        }
      }
    }

    console.log('\n✅ ¡Creación de colecciones y datos completada!');
    console.log('\n📊 Resumen:');
    console.log(`   - Radios: ${radios.length} registros`);
    console.log(`   - Frases: ${phrases.length} registros`);
    console.log(`   - Detecciones: 5 registros de ejemplo`);
    console.log(`   - Capturas: 3 registros de ejemplo`);
    
    console.log('\n🎉 ¡Listo para usar! El dashboard ahora debería funcionar con datos reales.');

  } catch (error) {
    console.error('❌ Error durante la creación:', error);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Las colecciones ya existen. Puedes:');
      console.log('   1. Eliminar las colecciones existentes y volver a ejecutar');
      console.log('   2. Usar el script import-seed-data.js para solo agregar datos');
    }
  }
}

createCollectionsWithData();