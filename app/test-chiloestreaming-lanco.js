#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Función para probar un stream y obtener metadata
async function testStream(url, port, protocol = 'https') {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)',
        'Icy-MetaData': '1'  // Solicitar metadata de SHOUTcast
      },
      timeout: 10000
    };

    const client = protocol === 'https' ? https : http;
    
    console.log(`\n🔍 Probando: ${url}`);
    
    const req = client.request(url, options, (res) => {
      let metadata = '';
      let hasMetadata = false;
      
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`🖥️  Server: ${res.headers.server || 'Unknown'}`);
      console.log(`🎵 Content-Type: ${res.headers['content-type'] || 'Unknown'}`);
      console.log(`📻 ICE-Name: ${res.headers['icy-name'] || 'Not found'}`);
      console.log(`📻 ICE-Description: ${res.headers['icy-description'] || 'Not found'}`);
      console.log(`📻 ICE-Genre: ${res.headers['icy-genre'] || 'Not found'}`);
      
      // Si es audio/mpeg, es un stream válido
      if (res.headers['content-type'] && res.headers['content-type'].includes('audio')) {
        console.log(`✅ Stream válido encontrado!`);
        
        // Destruir la conexión para no descargar todo el audio
        res.destroy();
        
        resolve({
          url: url,
          port: port,
          status: res.statusCode,
          online: true,
          server: res.headers.server,
          contentType: res.headers['content-type'],
          iceName: res.headers['icy-name'],
          iceDescription: res.headers['icy-description'],
          iceGenre: res.headers['icy-genre']
        });
      } else {
        resolve({
          url: url,
          port: port,
          status: res.statusCode,
          online: false,
          error: 'No es un stream de audio'
        });
      }
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({
        url: url,
        port: port,
        status: 0,
        online: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      console.log(`⏰ Timeout`);
      req.destroy();
      resolve({
        url: url,
        port: port,
        status: 0,
        online: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

// Función principal
async function main() {
  console.log('🎵 Buscando el stream correcto para LANCO FM...\n');
  
  // Probar los puertos que encontramos
  const testUrls = [
    'https://streaming.chiloestreaming.com:10995/;stream.mp3',
    'https://streaming.chiloestreaming.com:10998/;stream.mp3',
    'http://streaming.chiloestreaming.com:10995/;stream.mp3',
    'http://streaming.chiloestreaming.com:10998/;stream.mp3'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    const port = parseInt(url.match(/:(\d+)/)[1]);
    const protocol = url.startsWith('https') ? 'https' : 'http';
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 Probando puerto ${port} con ${protocol.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testStream(url, port, protocol);
    results.push(result);
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log(`${'='.repeat(60)}`);
  
  const onlineStreams = results.filter(r => r.online);
  
  if (onlineStreams.length > 0) {
    console.log('🎉 Streams online encontrados:');
    onlineStreams.forEach((stream, index) => {
      console.log(`\n${index + 1}. Puerto ${stream.port} (${stream.url.startsWith('https') ? 'HTTPS' : 'HTTP'})`);
      console.log(`   URL: ${stream.url}`);
      console.log(`   Servidor: ${stream.server}`);
      console.log(`   Nombre ICE: ${stream.iceName || 'No disponible'}`);
      console.log(`   Descripción: ${stream.iceDescription || 'No disponible'}`);
      console.log(`   Género: ${stream.iceGenre || 'No disponible'}`);
      
      // Intentar identificar si es LANCO FM
      const nameLower = (stream.iceName || '').toLowerCase();
      const descLower = (stream.iceDescription || '').toLowerCase();
      
      if (nameLower.includes('lanco') || descLower.includes('lanco')) {
        console.log(`   ✅ ¡ESTE PARECE SER LANCO FM!`);
      } else if (nameLower.includes('radio') && (nameLower.includes('fm') || nameLower.includes('am'))) {
        console.log(`   📻 Posible estación de radio`);
      }
    });
  } else {
    console.log('❌ No se encontraron streams online');
  }
  
  // Recomendación final
  console.log(`\n${'='.repeat(60)}`);
  console.log('💡 RECOMENDACIÓN');
  console.log(`${'='.repeat(60)}`);
  
  if (onlineStreams.length > 0) {
    const bestStream = onlineStreams[0]; // Tomar el primero como mejor opción
    console.log(`La URL más probable para LANCO FM es:`);
    console.log(`🔗 ${bestStream.url}`);
    console.log(`📝 Esta URL responde con status ${bestStream.status} y sirve contenido de audio`);
    
    if (bestStream.iceName) {
      console.log(`📻 Nombre del stream: ${bestStream.iceName}`);
    }
  } else {
    console.log('No se encontraron streams funcionales. Revisar con el proveedor de streaming.');
  }
}

// Ejecutar
main().catch(console.error);