const https = require('https');

async function testQuieroAPI() {
  console.log('🎵 Probando verificación de FM Quiero de Antofagasta...');
  
  const radioId = 'radio_mijm9xcr_i4kd83i';
  const apiUrl = `http://localhost:3000/api/radios-direct/${radioId}/verify`;
  
  console.log(`📡 Llamando a: ${apiUrl}`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      const url = new URL(apiUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHZlcmlmaWNhZG9yLmNvbSIsInJvbGUiOiJhZG1pbiIsImlkIjoiYWRtaW4tMSIsImlhdCI6MTczMzAwNzMwMCwiZXhwIjoxNzMzNjEyMTAwfQ.qpPb5qRKU5mGLqR5bLr6Xj8w7yXqZ9Y8w8Z9Y8w8Z9Y'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(JSON.stringify({}));
      req.end();
    });

    console.log(`✅ Respuesta recibida - Status: ${response.status}`);
    console.log('📊 Datos:', response.data);
    
    try {
      const parsedData = JSON.parse(response.data);
      console.log('\n📋 Resultado formateado:');
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('📋 Respuesta (texto plano):', response.data);
    }

  } catch (error) {
    console.error('❌ Error al llamar a la API:', error.message);
  }
}

testQuieroAPI();