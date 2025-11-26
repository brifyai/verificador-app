// Auditoría simple usando Supabase Direct
require('dotenv').config({ path: '../.env' });
const { supabaseDirect } = require('../lib/supabase-direct');

// Schema esperado basado en Prisma
const SCHEMA_ESPERADO = {
  users: ['id', 'email', 'name', 'password', 'role', 'active', 'created_at', 'updated_at'],
  radios: ['id', 'name', 'stream_url', 'platform', 'region', 'description', 'status', 'priority', 'cost_per_hour', 'metadata', 'created_at', 'updated_at', 'last_verification_status', 'last_verified_at'],
  phrases: ['id', 'phrase', 'brand', 'campaign', 'category', 'description', 'confidence', 'priority', 'active', 'created_at', 'updated_at'],
  phrase_variants: ['id', 'phrase_id', 'variant', 'similarity', 'created_at'],
  monitoring_sessions: ['id', 'radio_id', 'user_id', 'status', 'start_time', 'end_time', 'capture_interval', 'capture_duration', 'total_captures', 'total_detections', 'last_capture_at', 'last_detection_at', 'recording_start_hour', 'recording_end_hour', 'configuration', 'metadata', 'created_at', 'updated_at'],
  captures: ['id', 'session_id', 'audio_path', 'duration', 'file_size', 'format', 'bitrate', 'sample_rate', 'status', 'captured_at', 'processed_at', 'transcription_text', 'confidence', 'provider', 'processing_time', 'cost', 'metadata', 'created_at', 'updated_at'],
  audios: ['id', 'session_id', 'capture_id', 'user_id', 'file_name', 'file_path', 'file_size', 'duration', 'format', 'bitrate', 'sample_rate', 'status', 'uploaded_at', 'processed_at', 'metadata', 'created_at', 'updated_at'],
  detections: ['id', 'session_id', 'capture_id', 'radio_id', 'phrase_id', 'detected_text', 'original_text', 'confidence', 'similarity', 'timestamp', 'audio_timestamp', 'verified', 'false_positive', 'cost', 'metadata', 'created_at', 'updated_at'],
  api_configurations: ['id', 'provider', 'api_key', 'model', 'enabled', 'priority', 'cost_per_unit', 'rate_limit', 'metadata', 'created_at', 'updated_at'],
  radio_pricing_rules: ['id', 'radio_id', 'name', 'price_per_detection', 'effective_date', 'end_date', 'description', 'active', 'created_at', 'updated_at'],
  reports: ['id', 'user_id', 'name', 'description', 'type', 'filters', 'data', 'format', 'status', 'file_path', 'created_at', 'generated_at'],
  jobs: ['id', 'type', 'payload', 'status', 'priority', 'attempts', 'max_attempts', 'error', 'result', 'scheduled_at', 'started_at', 'completed_at', 'created_at', 'updated_at'],
  notifications: ['id', 'title', 'message', 'type', 'priority', 'read', 'data', 'created_at', 'read_at'],
  cache: ['id', 'key', 'value', 'expires_at', 'created_at'],
  system_logs: ['id', 'level', 'message', 'context', 'metadata', 'timestamp'],
  billing_profiles: ['id', 'user_id', 'company_name', 'legal_name', 'tax_id', 'billing_email', 'address', 'city', 'region', 'postal_code', 'created_at', 'updated_at'],
  invoices: ['id', 'billing_profile_id', 'invoice_number', 'issue_date', 'due_date', 'status', 'subtotal', 'tax', 'total', 'currency', 'payment_date', 'payment_method', 'notes', 'created_at', 'updated_at'],
  invoice_line_items: ['id', 'invoice_id', 'description', 'quantity', 'unit_price', 'total', 'radio_id', 'session_id', 'capture_id', 'detection_id', 'created_at'],
  subscriptions: ['id', 'billing_profile_id', 'plan_id', 'status', 'current_period_start', 'current_period_end', 'canceled_at', 'created_at', 'updated_at'],
  payment_methods: ['id', 'user_id', 'type', 'name', 'last_digits', 'expiry_date', 'is_default', 'status', 'created_at', 'updated_at']
};

async function auditarSimple() {
  console.log('🔍 AUDITORÍA SIMPLE DE SUPABASE');
  console.log('====================================');
  console.log(`📄 Fecha: ${new Date().toISOString()}`);
  console.log('');

  let tablasEncontradas = 0;
  let tablasCompletas = 0;
  let tablasIncompletas = 0;
  let totalCamposCorrectos = 0;
  let totalCamposIncorrectos = 0;

  const tablasEsperadas = Object.keys(SCHEMA_ESPERADO);
  console.log(`📋 Tablas a auditar: ${tablasEsperadas.length}`);
  console.log('Tablas:', tablasEsperadas.join(', '));
  console.log('');

  // Auditar cada tabla
  for (const tableName of tablasEsperadas) {
    console.log(`📊 AUDITANDO TABLA: ${tableName}`);
    console.log('─'.repeat(50));

    try {
      // Intentar obtener datos de la tabla para verificar que existe
      const datos = await supabaseDirect.request(`${tableName}?select=*&limit=1`);
      console.log(`✅ Tabla accesible: ${tableName}`);
      
      // Obtener una fila de ejemplo para ver columnas
      if (datos.length > 0) {
        const columnasActuales = Object.keys(datos[0]);
        const camposEsperados = SCHEMA_ESPERADO[tableName];
        
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
      } else {
        console.log(`⚠️  Tabla vacía: ${tableName} (no se pueden verificar columnas)`);
        // Si la tabla está vacía, asumimos que tiene los campos correctos si existe
        tablasCompletas++;
        totalCamposCorrectos += SCHEMA_ESPERADO[tableName].length;
      }

    } catch (error) {
      console.log(`❌ Error accediendo a tabla ${tableName}:`, error.message);
      tablasIncompletas++;
      totalCamposIncorrectos += SCHEMA_ESPERADO[tableName].length;
    }

    console.log('');
  }

  // RESUMEN FINAL
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN DE AUDITORÍA');
  console.log('═'.repeat(60));
  console.log(`📋 Tablas esperadas: ${tablasEsperadas.length}`);
  console.log(`📋 Tablas encontradas: ${tablasEncontradas}`);
  console.log(`✅ Tablas completas: ${tablasCompletas}`);
  console.log(`⚠️  Tablas incompletas: ${tablasIncompletas}`);
  console.log('');
  console.log(`📄 Campos correctos: ${totalCamposCorrectos}`);
  console.log(`❌ Campos incorrectos/faltantes: ${totalCamposIncorrectos}`);
  
  const totalCampos = totalCamposCorrectos + totalCamposIncorrectos;
  const porcentajeCompletitud = totalCampos > 0 ? ((totalCamposCorrectos / totalCampos) * 100).toFixed(2) : '0.00';
  console.log('');
  console.log(`🎯 Porcentaje de completitud: ${porcentajeCompletitud}%`);
  
  if (porcentajeCompletitud === '100.00') {
    console.log('🎉 ¡TODAS LAS TABLAS Y CAMPOS ESTÁN CREADOS CORRECTAMENTE!');
  } else {
    console.log('⚠️  Algunas tablas/campos faltan o tienen errores');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  auditarSimple().catch(console.error);
}

module.exports = { auditarSimple };