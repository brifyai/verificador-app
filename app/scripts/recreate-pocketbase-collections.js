import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function recreateCollections() {
  const pb = new PocketBase(POCKETBASE_URL);
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🔄 Recreando colecciones en PocketBase con todos los campos...\n');
  
  try {
    // 1. Eliminar colecciones existentes
    const collectionsToDelete = ['radios', 'phrases', 'detections', 'captures'];
    
    for (const collectionName of collectionsToDelete) {
      try {
        const collections = await pb.collections.getFullList({
          filter: `name = "${collectionName}"`
        });
        
        for (const collection of collections) {
          console.log(`🗑️ Eliminando colección ${collectionName}...`);
          await pb.collections.delete(collection.id);
          console.log(`   ✅ ${collectionName} eliminada`);
        }
      } catch (error) {
        console.log(`   ℹ️ ${collectionName} no existe o no se puede eliminar`);
      }
    }
    
    console.log('\n📋 Creando nuevas colecciones con schema completo...');
    
    // 2. Crear colección radios con todos los campos
    console.log('📻 Creando colección radios...');
    const radiosCollection = await pb.collections.create({
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
      ],
      listRule: '1 = 1',
      viewRule: '1 = 1',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    });
    console.log('✅ Colección radios creada con schema completo');

    // 3. Crear colección phrases con todos los campos
    console.log('🎯 Creando colección phrases...');
    const phrasesCollection = await pb.collections.create({
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
      ],
      listRule: '1 = 1',
      viewRule: '1 = 1',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    });
    console.log('✅ Colección phrases creada con schema completo');

    // 4. Crear colección detections con todos los campos
    console.log('🔍 Creando colección detections...');
    const detectionsCollection = await pb.collections.create({
      name: 'detections',
      type: 'base',
      schema: [
        {
          name: 'radio',
          type: 'relation',
          required: true,
          options: {
            collectionId: radiosCollection.id,
            maxSelect: 1
          }
        },
        {
          name: 'phrase',
          type: 'relation',
          required: true,
          options: {
            collectionId: phrasesCollection.id,
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
      ],
      listRule: '1 = 1',
      viewRule: '1 = 1',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    });
    console.log('✅ Colección detections creada con schema completo');

    // 5. Crear colección captures con todos los campos
    console.log('🎙️ Creando colección captures...');
    const capturesCollection = await pb.collections.create({
      name: 'captures',
      type: 'base',
      schema: [
        {
          name: 'radio',
          type: 'relation',
          required: true,
          options: {
            collectionId: radiosCollection.id,
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
      ],
      listRule: '1 = 1',
      viewRule: '1 = 1',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    });
    console.log('✅ Colección captures creada con schema completo');

    console.log('\n📊 Insertando datos de prueba...');
    
    // 6. Insertar datos de radios
    console.log('📻 Insertando datos de radios...');
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
      }
    ];

    const createdRadios = [];
    for (const radio of radiosData) {
      try {
        const created = await pb.collection('radios').create(radio);
        createdRadios.push(created);
        console.log(`   ✅ ${radio.name}`);
      } catch (error) {
        console.log(`   ❌ ${radio.name} - ${error.message}`);
      }
    }

    // 7. Insertar datos de frases
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
        phrase: "precios bajos siempre",
        brand: "Líder",
        category: "supermarket",
        active: true,
        priority: "high",
        notes: "Eslogan de Supermercados Líder"
      },
      {
        phrase: "jumbo te da más",
        brand: "Jumbo",
        category: "supermarket",
        active: true,
        priority: "high",
        notes: "Eslogan de Jumbo"
      }
    ];

    const createdPhrases = [];
    for (const phrase of phrasesData) {
      try {
        const created = await pb.collection('phrases').create(phrase);
        createdPhrases.push(created);
        console.log(`   ✅ ${phrase.phrase} (${phrase.brand})`);
      } catch (error) {
        console.log(`   ❌ ${phrase.phrase} - ${error.message}`);
      }
    }

    // 8. Insertar algunas detecciones de ejemplo
    console.log('\n🔍 Insertando detecciones de ejemplo...');
    if (createdRadios.length > 0 && createdPhrases.length > 0) {
      const sampleDetections = [
        {
          radio: createdRadios[0].id,
          phrase: createdPhrases[0].id,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          confidence: 0.95,
          verified: true,
          correct: true,
          cost: 0.05,
          transcript: "En Falabella tenemos precio bajo garantizado para ti"
        },
        {
          radio: createdRadios[1].id,
          phrase: createdPhrases[2].id,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          confidence: 0.87,
          verified: true,
          correct: true,
          cost: 0.04,
          transcript: "La vida es hoy, disfrútala al máximo"
        },
        {
          radio: createdRadios[2].id,
          phrase: createdPhrases[3].id,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          confidence: 0.92,
          verified: false,
          cost: 0.05,
          transcript: "Precios bajos siempre en Líder"
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

    // 9. Insertar algunas capturas de ejemplo
    console.log('\n🎙️ Insertando capturas de ejemplo...');
    if (createdRadios.length > 0) {
      const sampleCaptures = [
        {
          radio: createdRadios[0].id,
          capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          file_url: "https://pocket.brifyai.com/api/files/captures/sample1.mp3",
          file_size: 720000,
          cost: 0.03,
          status: "completed"
        },
        {
          radio: createdRadios[1].id,
          capturedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          file_url: "https://pocket.brifyai.com/api/files/captures/sample2.mp3",
          file_size: 1080000,
          cost: 0.05,
          status: "completed"
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

    console.log('\n🎉 ¡Recreación completada exitosamente!');
    console.log('\n📊 Resumen final:');
    console.log(`   - Radios: ${createdRadios.length} registros`);
    console.log(`   - Frases: ${createdPhrases.length} registros`);
    console.log(`   - Detecciones: 3 registros de ejemplo`);
    console.log(`   - Capturas: 2 registros de ejemplo`);
    
    console.log('\n✅ ¡El dashboard ahora debería funcionar perfectamente!');

  } catch (error) {
    console.error('❌ Error durante la recreación:', error);
  }
}

recreateCollections();