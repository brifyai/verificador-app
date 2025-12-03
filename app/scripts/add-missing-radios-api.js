const fetch = require('node-fetch');

async function addMissingRadios() {
  try {
    console.log('📝 Agregando radios faltantes usando la API...');
    
    // Primero obtener el token de autenticación
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ondaverificada.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Error en login');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('✅ Login exitoso, token obtenido');

    // Radios que necesitamos agregar
    const radiosToAdd = [
      {
        id: 'mijm9xci',
        name: 'Radio MiJM9XCI',
        stream_url: 'http://stream.example.com/mijm9xci',
        platform: 'HTTP_STREAM',
        region: 'Región Metropolitana',
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE',
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xci'
        }
      },
      {
        id: 'mijm9xsi',
        name: 'Radio MiJM9XSI',
        stream_url: 'http://stream.example.com/mijm9xsi',
        platform: 'HTTP_STREAM',
        region: 'Región Metropolitana', 
        description: 'Santiago - Streaming Online',
        status: 'ACTIVE',
        priority: 1,
        cost_per_hour: 0.0,
        metadata: {
          city: 'Santiago',
          frequency: 'Online',
          type: 'streaming',
          original_id: 'mijm9xsi'
        }
      }
    ];

    for (const radio of radiosToAdd) {
      try {
        console.log(`📝 Creando radio: ${radio.name} (${radio.id})`);
        
        // Verificar si ya existe
        const checkResponse = await fetch(`http://localhost:3000/api/radios-direct?id=eq.${radio.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing && existing.length > 0) {
            console.log(`✅ Radio ${radio.id} ya existe, actualizando...`);
            
            // Actualizar con el nombre real
            const updateResponse = await fetch(`http://localhost:3000/api/radios-direct?id=eq.${radio.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: radio.name,
                region: radio.region,
                description: radio.description,
                platform: radio.platform,
                status: radio.status,
                priority: radio.priority,
                cost_per_hour: radio.cost_per_hour,
                metadata: radio.metadata
              })
            });

            if (updateResponse.ok) {
              console.log(`✅ Radio actualizada: ${radio.name} (${radio.id})`);
            } else {
              console.log(`⚠️ Radio ya existe con nombre real: ${radio.name} (${radio.id})`);
            }
            continue;
          }
        }

        // Crear nueva radio
        const createResponse = await fetch('http://localhost:3000/api/radios-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(radio)
        });

        if (createResponse.ok) {
          console.log(`✅ Radio creada: ${radio.name} (${radio.id})`);
        } else {
          const errorText = await createResponse.text();
          console.log(`⚠️ Radio ${radio.id} ya existe o error: ${errorText}`);
        }
        
      } catch (error) {
        console.error(`❌ Error con radio ${radio.id}:`, error.message);
      }
    }

    console.log('✅ Proceso de agregar radios completado');
    
    // Verificar radios finales
    const finalResponse = await fetch('http://localhost:3000/api/radios-direct?select=id,name,region&order=name.asc', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (finalResponse.ok) {
      const allRadios = await finalResponse.json();
      console.log('\n📋 Radios disponibles en la tabla:');
      allRadios.forEach(radio => {
        console.log(`  ID: ${radio.id} | Nombre: ${radio.name} | Región: ${radio.region}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

addMissingRadios();