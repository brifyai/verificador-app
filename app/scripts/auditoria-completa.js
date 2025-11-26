// Script de auditoría completa - Verifica tablas y campos en Supabase
const SUPABASE_URL = "http://supabasekong-u4g0k80skos0s0gww8wks800.147.93.182.94.sslip.io";
const SUPABASE_ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDEwNzE2MCwiZXhwIjo0OTE5NzgwNzYwLCJyb2xlIjoiYW5vbiJ9.52uLuYBh1c1_wHOgGkj4wPMzRWd6-bashlBU3p90wGw";

// Schema esperado basado en Prisma
const SCHEMA_ESPERADO = {
  users: {
    campos: ['id', 'email', 'name', 'password', 'role', 'active', 'created_at', 'updated_at'],
    tipos: { id: 'text', email: 'text', name: 'text', password: 'text', role: 'text', active: 'boolean', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (email)']
  },
  radios: {
    campos: ['id', 'name', 'stream_url', 'platform', 'region', 'description', 'status', 'priority', 'cost_per_hour', 'metadata', 'created_at', 'updated_at', 'last_verification_status', 'last_verified_at'],
    tipos: { id: 'text', name: 'text', stream_url: 'text', platform: 'text', region: 'text', description: 'text', status: 'text', priority: 'integer', cost_per_hour: 'real', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp', last_verification_status: 'text', last_verified_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (name, region)']
  },
  phrases: {
    campos: ['id', 'phrase', 'brand', 'campaign', 'category', 'description', 'confidence', 'priority', 'active', 'created_at', 'updated_at'],
    tipos: { id: 'text', phrase: 'text', brand: 'text', campaign: 'text', category: 'text', description: 'text', confidence: 'real', priority: 'integer', active: 'boolean', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)']
  },
  phrase_variants: {
    campos: ['id', 'phrase_id', 'variant', 'similarity', 'created_at'],
    tipos: { id: 'text', phrase_id: 'text', variant: 'text', similarity: 'real', created_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (phrase_id) REFERENCES phrases(id)']
  },
  monitoring_sessions: {
    campos: ['id', 'radio_id', 'user_id', 'status', 'start_time', 'end_time', 'capture_interval', 'capture_duration', 'total_captures', 'total_detections', 'last_capture_at', 'last_detection_at', 'recording_start_hour', 'recording_end_hour', 'configuration', 'metadata', 'created_at', 'updated_at'],
    tipos: { id: 'text', radio_id: 'text', user_id: 'text', status: 'text', start_time: 'timestamp', end_time: 'timestamp', capture_interval: 'integer', capture_duration: 'integer', total_captures: 'integer', total_detections: 'integer', last_capture_at: 'timestamp', last_detection_at: 'timestamp', recording_start_hour: 'integer', recording_end_hour: 'integer', configuration: 'jsonb', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (radio_id) REFERENCES radios(id)', 'FOREIGN KEY (user_id) REFERENCES users(id)']
  },
  captures: {
    campos: ['id', 'session_id', 'audio_path', 'duration', 'file_size', 'format', 'bitrate', 'sample_rate', 'status', 'captured_at', 'processed_at', 'transcription_text', 'confidence', 'provider', 'processing_time', 'cost', 'metadata', 'created_at', 'updated_at'],
    tipos: { id: 'text', session_id: 'text', audio_path: 'text', duration: 'real', file_size: 'bigint', format: 'text', bitrate: 'integer', sample_rate: 'integer', status: 'text', captured_at: 'timestamp', processed_at: 'timestamp', transcription_text: 'text', confidence: 'real', provider: 'text', processing_time: 'real', cost: 'real', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id)']
  },
  audios: {
    campos: ['id', 'session_id', 'capture_id', 'user_id', 'file_name', 'file_path', 'file_size', 'duration', 'format', 'bitrate', 'sample_rate', 'status', 'uploaded_at', 'processed_at', 'metadata', 'created_at', 'updated_at'],
    tipos: { id: 'text', session_id: 'text', capture_id: 'text', user_id: 'text', file_name: 'text', file_path: 'text', file_size: 'bigint', duration: 'real', format: 'text', bitrate: 'integer', sample_rate: 'integer', status: 'text', uploaded_at: 'timestamp', processed_at: 'timestamp', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)']
  },
  detections: {
    campos: ['id', 'session_id', 'capture_id', 'radio_id', 'phrase_id', 'detected_text', 'original_text', 'confidence', 'similarity', 'timestamp', 'audio_timestamp', 'verified', 'false_positive', 'cost', 'metadata', 'created_at', 'updated_at'],
    tipos: { id: 'text', session_id: 'text', capture_id: 'text', radio_id: 'text', phrase_id: 'text', detected_text: 'text', original_text: 'text', confidence: 'real', similarity: 'real', timestamp: 'timestamp', audio_timestamp: 'real', verified: 'boolean', false_positive: 'boolean', cost: 'real', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (session_id) REFERENCES monitoring_sessions(id)', 'FOREIGN KEY (capture_id) REFERENCES captures(id)', 'FOREIGN KEY (radio_id) REFERENCES radios(id)', 'FOREIGN KEY (phrase_id) REFERENCES phrases(id)']
  },
  api_configurations: {
    campos: ['id', 'provider', 'api_key', 'model', 'enabled', 'priority', 'cost_per_unit', 'rate_limit', 'metadata', 'created_at', 'updated_at'],
    tipos: { id: 'text', provider: 'text', api_key: 'text', model: 'text', enabled: 'boolean', priority: 'integer', cost_per_unit: 'real', rate_limit: 'integer', metadata: 'jsonb', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (provider)']
  },
  radio_pricing_rules: {
    campos: ['id', 'radio_id', 'name', 'price_per_detection', 'effective_date', 'end_date', 'description', 'active', 'created_at', 'updated_at'],
    tipos: { id: 'text', radio_id: 'text', name: 'text', price_per_detection: 'real', effective_date: 'timestamp', end_date: 'timestamp', description: 'text', active: 'boolean', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (radio_id) REFERENCES radios(id)']
  },
  reports: {
    campos: ['id', 'user_id', 'name', 'description', 'type', 'filters', 'data', 'format', 'status', 'file_path', 'created_at', 'generated_at'],
    tipos: { id: 'text', user_id: 'text', name: 'text', description: 'text', type: 'text', filters: 'jsonb', data: 'jsonb', format: 'text', status: 'text', file_path: 'text', created_at: 'timestamp', generated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (user_id) REFERENCES users(id)']
  },
  jobs: {
    campos: ['id', 'type', 'payload', 'status', 'priority', 'attempts', 'max_attempts', 'error', 'result', 'scheduled_at', 'started_at', 'completed_at', 'created_at', 'updated_at'],
    tipos: { id: 'text', type: 'text', payload: 'jsonb', status: 'text', priority: 'integer', attempts: 'integer', max_attempts: 'integer', error: 'text', result: 'jsonb', scheduled_at: 'timestamp', started_at: 'timestamp', completed_at: 'timestamp', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)']
  },
  notifications: {
    campos: ['id', 'title', 'message', 'type', 'priority', 'read', 'data', 'created_at', 'read_at'],
    tipos: { id: 'text', title: 'text', message: 'text', type: 'text', priority: 'text', read: 'boolean', data: 'jsonb', created_at: 'timestamp', read_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)']
  },
  cache: {
    campos: ['id', 'key', 'value', 'expires_at', 'created_at'],
    tipos: { id: 'text', key: 'text', value: 'jsonb', expires_at: 'timestamp', created_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (key)']
  },
  system_logs: {
    campos: ['id', 'level', 'message', 'context', 'metadata', 'timestamp'],
    tipos: { id: 'text', level: 'text', message: 'text', context: 'text', metadata: 'jsonb', timestamp: 'timestamp' },
    constraints: ['PRIMARY KEY (id)']
  },
  billing_profiles: {
    campos: ['id', 'user_id', 'company_name', 'legal_name', 'tax_id', 'billing_email', 'address', 'city', 'region', 'postal_code', 'created_at', 'updated_at'],
    tipos: { id: 'text', user_id: 'text', company_name: 'text', legal_name: 'text', tax_id: 'text', billing_email: 'text', address: 'text', city: 'text', region: 'text', postal_code: 'text', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (user_id)', 'FOREIGN KEY (user_id) REFERENCES users(id)']
  },
  invoices: {
    campos: ['id', 'billing_profile_id', 'invoice_number', 'issue_date', 'due_date', 'status', 'subtotal', 'tax', 'total', 'currency', 'payment_date', 'payment_method', 'notes', 'created_at', 'updated_at'],
    tipos: { id: 'text', billing_profile_id: 'text', invoice_number: 'text', issue_date: 'timestamp', due_date: 'timestamp', status: 'text', subtotal: 'decimal', tax: 'decimal', total: 'decimal', currency: 'text', payment_date: 'timestamp', payment_method: 'text', notes: 'text', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (invoice_number)', 'FOREIGN KEY (billing_profile_id) REFERENCES billing_profiles(id)']
  },
  invoice_line_items: {
    campos: ['id', 'invoice_id', 'description', 'quantity', 'unit_price', 'total', 'radio_id', 'session_id', 'capture_id', 'detection_id', 'created_at'],
    tipos: { id: 'text', invoice_id: 'text', description: 'text', quantity: 'integer', unit_price: 'decimal', total: 'decimal', radio_id: 'text', session_id: 'text', capture_id: 'text', detection_id: 'text', created_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (invoice_id) REFERENCES invoices(id)']
  },
  subscriptions: {
    campos: ['id', 'billing_profile_id', 'plan_id', 'status', 'current_period_start', 'current_period_end', 'canceled_at', 'created_at', 'updated_at'],
    tipos: { id: 'text', billing_profile_id: 'text', plan_id: 'text', status: 'text', current_period_start: 'timestamp', current_period_end: 'timestamp', canceled_at: 'timestamp', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'UNIQUE (billing_profile_id)', 'FOREIGN KEY (billing_profile_id) REFERENCES billing_profiles(id)']
  },
  payment_methods: {
    campos: ['id', 'user_id', 'type', 'name', 'last_digits', 'expiry_date', 'is_default', 'status', 'created_at', 'updated_at'],
    tipos: { id: 'text', user_id: 'text', type: 'text', name: 'text', last_digits: 'text', expiry_date: 'text', is_default: 'boolean', status: 'text', created_at: 'timestamp', updated_at: 'timestamp' },
    constraints: ['PRIMARY KEY (id)', 'FOREIGN KEY (user_id) REFERENCES users(id)']
  }
};

async function auditarSupabase() {
  console.log('🔍 AUDITORÍA COMPLETA DE SUPABASE');
  console.log('====================================');
  console.log(`📡 URL: ${SUPABASE_URL}`);
  console.log(`📄 Fecha: ${new Date().toISOString()}`);
  console.log('');

  let tablasEncontradas = 0;
  let tablasCompletas = 0;
  let tablasIncompletas = 0;
  let totalCamposCorrectos = 0;
  let totalCamposIncorrectos = 0;
  let totalConstraintsCorrectas = 0;
  let totalConstraintsIncorrectas = 0;

  // Obtener lista de tablas
  console.log('📋 Obteniendo tablas de Supabase...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      console.error('❌ Error obteniendo tablas:', response.status, await response.text());
      return;
    }

    const tablas = await response.json();
    tablasEncontradas = tablas.length;
    console.log(`✅ Tablas encontradas: ${tablasEncontradas}\n`);

    // Auditar cada tabla
    for (const tabla of tablas) {
      const tableName = tabla.table_name;
      console.log(`📊 AUDITANDO TABLA: ${tableName}`);
      console.log('─'.repeat(50));

      if (!SCHEMA_ESPERADO[tableName]) {
        console.log(`⚠️  Tabla no esperada en schema: ${tableName}`);
        console.log('');
        continue;
      }

      // Obtener columnas
      const columnasResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ table_name: tableName })
      });

      const columnas = await columnasResponse.json();
      const columnasActuales = columnas.map(c => c.column_name);

      // Verificar campos
      const camposEsperados = SCHEMA_ESPERADO[tableName].campos;
      const camposFaltantes = camposEsperados.filter(c => !columnasActuales.includes(c));
      const camposExtra = columnasActuales.filter(c => !camposEsperados.includes(c));

      console.log(`📄 Campos esperados: ${camposEsperados.length}`);
      console.log(`📄 Campos encontrados: ${columnasActuales.length}`);

      if (camposFaltantes.length === 0 && camposExtra.length === 0) {
        console.log('✅ TODOS LOS CAMPOS CORRECTOS');
        tablasCompletas++;
        totalCamposCorrectos += camposEsperados.length;
      } else {
        tablasIncompletas++;
        if (camposFaltantes.length > 0) {
          console.log(`❌ Campos faltantes: ${camposFaltantes.join(', ')}`);
          totalCamposIncorrectos += camposFaltantes.length;
        }
        if (camposExtra.length > 0) {
          console.log(`⚠️  Campos extra: ${camposExtra.join(', ')}`);
        }
        // Verificar campos que sí existen
        const camposCorrectos = camposEsperados.filter(c => columnasActuales.includes(c));
        totalCamposCorrectos += camposCorrectos.length;
        totalCamposIncorrectos += (camposEsperados.length - camposCorrectos.length);
      }

      // Verificar tipos de datos
      console.log('');
      console.log('📐 Verificando tipos de datos:');
      let tiposCorrectos = 0;
      let tiposIncorrectos = 0;
      
      for (const columna of columnas) {
        const campo = columna.column_name;
        const tipoActual = columna.data_type;
        const tipoEsperado = SCHEMA_ESPERADO[tableName].tipos[campo];
        
        if (tipoEsperado) {
          // Mapeo de tipos de PostgreSQL a tipos esperados
          const tipoNormalizado = tipoActual.toLowerCase();
          let tipoCoincide = false;
          
          if (tipoEsperado === 'text' && (tipoNormalizado.includes('text') || tipoNormalizado.includes('varchar'))) tipoCoincide = true;
          else if (tipoEsperado === 'boolean' && tipoNormalizado.includes('bool')) tipoCoincide = true;
          else if (tipoEsperado === 'integer' && tipoNormalizado.includes('int')) tipoCoincide = true;
          else if (tipoEsperado === 'real' && (tipoNormalizado.includes('real') || tipoNormalizado.includes('float'))) tipoCoincide = true;
          else if (tipoEsperado === 'bigint' && tipoNormalizado.includes('bigint')) tipoCoincide = true;
          else if (tipoEsperado === 'timestamp' && tipoNormalizado.includes('timestamp')) tipoCoincide = true;
          else if (tipoEsperado === 'jsonb' && tipoNormalizado.includes('jsonb')) tipoCoincide = true;
          else if (tipoEsperado === 'decimal' && tipoNormalizado.includes('numeric')) tipoCoincide = true;
          
          if (tipoCoincide) {
            tiposCorrectos++;
          } else {
            tiposIncorrectos++;
            console.log(`❌ Campo ${campo}: tipo ${tipoActual} (esperado: ${tipoEsperado})`);
          }
        }
      }
      
      console.log(`✅ Tipos correctos: ${tiposCorrectos}`);
      if (tiposIncorrectos > 0) {
        console.log(`❌ Tipos incorrectos: ${tiposIncorrectos}`);
      }

      // Verificar constraints
      console.log('');
      console.log('🔒 Verificando constraints:');
      const constraintsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_constraints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ table_name: tableName })
      });

      const constraints = await constraintsResponse.json();
      const constraintsEsperadas = SCHEMA_ESPERADO[tableName].constraints;
      
      let constraintsEncontradas = 0;
      for (const constraint of constraintsEsperadas) {
        const existe = constraints.some(c => {
          const def = c.constraint_def?.toLowerCase() || '';
          const esperada = constraint.toLowerCase();
          return def.includes(esperada) || def.includes(esperada.replace('(', '').replace(')', ''));
        });
        
        if (existe) {
          constraintsEncontradas++;
          console.log(`✅ ${constraint}`);
        } else {
          console.log(`❌ Falta: ${constraint}`);
        }
      }
      
      totalConstraintsCorrectas += constraintsEncontradas;
      totalConstraintsIncorrectas += (constraintsEsperadas.length - constraintsEncontradas);
      
      console.log('');
    }

    // RESUMEN FINAL
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN DE AUDITORÍA');
    console.log('═'.repeat(60));
    console.log(`📋 Tablas esperadas: ${Object.keys(SCHEMA_ESPERADO).length}`);
    console.log(`📋 Tablas encontradas: ${tablasEncontradas}`);
    console.log(`✅ Tablas completas: ${tablasCompletas}`);
    console.log(`⚠️  Tablas incompletas: ${tablasIncompletas}`);
    console.log('');
    console.log(`📄 Campos correctos: ${totalCamposCorrectos}`);
    console.log(`❌ Campos incorrectos/faltantes: ${totalCamposIncorrectos}`);
    console.log('');
    console.log(`🔒 Constraints correctas: ${totalConstraintsCorrectas}`);
    console.log(`❌ Constraints incorrectas: ${totalConstraintsIncorrectas}`);
    console.log('');
    
    const porcentajeCompletitud = ((totalCamposCorrectos / (totalCamposCorrectos + totalCamposIncorrectos)) * 100).toFixed(2);
    console.log(`🎯 Porcentaje de completitud: ${porcentajeCompletitud}%`);
    
    if (porcentajeCompletitud === '100.00') {
      console.log('🎉 ¡TODAS LAS TABLAS Y CAMPOS ESTÁN CREADOS CORRECTAMENTE!');
    } else {
      console.log('⚠️  Algunas tablas/campos faltan o tienen errores');
    }

  } catch (error) {
    console.error('❌ Error en auditoría:', error.message);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  auditarSupabase().catch(console.error);
}

module.exports = { auditarSupabase };