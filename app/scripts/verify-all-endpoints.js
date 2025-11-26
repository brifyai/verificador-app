// Script para verificar que todos los endpoints funcionan
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

async function verifyEndpoints() {
  console.log('🔍 Verificando endpoints migrados...');
  console.log('=====================================\n');

  const endpoints = [
    { name: 'Dashboard Stats', path: '/api/dashboard/stats-direct', method: 'GET' },
    { name: 'Audios Stats', path: '/api/audios/stats', method: 'GET' },
    { name: 'Radios', path: '/api/radios-direct', method: 'GET' },
    { name: 'Phrases', path: '/api/phrases-direct', method: 'GET' },
    { name: 'Verificacion', path: '/api/verificacion-direct', method: 'GET' },
    { name: 'Detecciones', path: '/api/detecciones-direct', method: 'GET' },
    { name: 'Billing Profiles', path: '/api/billing/profiles', method: 'GET' },
    { name: 'Payment Methods', path: '/api/payment-methods', method: 'GET' },
    { name: 'Providers', path: '/api/providers', method: 'GET' },
    { name: 'Monitoring Status', path: '/api/monitoring/status', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${SUPABASE_URL}${endpoint.path}`;
      console.log(`📡 Probando: ${endpoint.name}`);
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ ÉXITO - ${response.status}`);
        console.log(`   📄 Datos: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const error = await response.text();
        console.log(`   ❌ ERROR - ${response.status}: ${error.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR DE CONEXIÓN: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎉 Verificación completada!');
  console.log('\n✅ Si ves "ÉXITO" en todos, la migración está completa!');
  console.log('⚠️  Si ves errores 404, verifica que RLS esté deshabilitado en Supabase');
}

verifyEndpoints().catch(console.error);