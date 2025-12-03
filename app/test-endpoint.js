
const http = require('http');

console.log('🔍 Probando endpoint /api/dashboard/stats-direct...');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dashboard/stats-direct',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📄 Respuesta completa:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (error) {
            console.log('❌ Error parseando JSON:', error.message);
            console.log('📄 Respuesta raw:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Error de conexión:', error.message);
    console.log('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
});

req.end();
