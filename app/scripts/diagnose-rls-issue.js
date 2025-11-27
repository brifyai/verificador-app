// Script para diagnosticar el problema exacto de RLS
const { supabaseDirect } = require('../lib/supabase-direct');

async function diagnoseRLSIssue() {
  console.log('🔍 DIAGNÓSTICO DE ROW LEVEL SECURITY EN SUPABASE\n');
  
  try {
    console.log('1. Probando conexión con ANON KEY...');
    const testAnon = await supabaseDirect.request('radios?select=count&limit=1');
    console.log('   ✅ ANON KEY funciona para lectura\n');
    
    console.log('2. Probando conexión con SERVICE ROLE KEY...');
    const testService = await supabaseDirect.request('radios?select=count&limit=1', {
      useServiceKey: true
    });
    console.log('   ✅ SERVICE ROLE KEY funciona para lectura\n');
    
    console.log('3. Probando tabla api_configurations con ANON KEY...');
    try {
      const testApiAnon = await supabaseDirect.request('api_configurations?select=count&limit=1');
      console.log('   ✅ ANON KEY puede leer api_configurations');
    } catch (error) {
      console.log('   ❌ ANON KEY NO puede leer api_configurations');
      console.log('   Error:', error.message);
    }
    
    console.log('\n4. Probando tabla api_configurations con SERVICE ROLE KEY...');
    try {
      const testApiService = await supabaseDirect.request('api_configurations?select=count&limit=1', {
        useServiceKey: true
      });
      console.log('   ✅ SERVICE ROLE KEY puede leer api_configurations');
    } catch (error) {
      console.log('   ❌ SERVICE ROLE KEY NO puede leer api_configurations');
      console.log('   Error:', error.message);
      console.log('\n   💡 ESTE ES EL PROBLEMA:');
      console.log('   La tabla api_configurations tiene RLS habilitada');
      console.log('   pero no hay políticas para el Service Role Key');
    }
    
    console.log('\n5. Solución: Deshabilitar RLS en api_configurations');
    console.log('   Ve a Supabase Dashboard > Tablas > api_configurations');
    console.log('   Haz clic en "Edit Table" y desmarca "Enable Row Level Security"');
    console.log('   O crea una política que permita acceso al Service Role');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnoseRLSIssue();