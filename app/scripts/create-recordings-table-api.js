#!/usr/bin/env node

// Script para crear la tabla recordings usando la API de Supabase directamente
const { supabaseDirect } = require('../lib/supabase-direct.js');

async function createRecordingsTable() {
  console.log('🔄 Creando tabla recordings en Supabase...');
  
  try {
    // SQL para crear la tabla recordings
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS recordings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        radio_id TEXT NOT NULL,
        radio_name TEXT NOT NULL,
        radio_region TEXT,
        radio_city TEXT,
        filename TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
      );

      -- Índices para mejorar el rendimiento
      CREATE INDEX IF NOT EXISTS idx_recordings_radio_id ON recordings(radio_id);
      CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
      CREATE INDEX IF NOT EXISTS idx_recordings_radio_name ON recordings(radio_name);

      -- Trigger para actualizar updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_recordings_updated_at ON recordings;
      CREATE TRIGGER update_recordings_updated_at
        BEFORE UPDATE ON recordings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Habilitar RLS (Row Level Security)
      ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

      -- Políticas de seguridad
      DROP POLICY IF EXISTS "Allow read access to all recordings" ON recordings;
      CREATE POLICY "Allow read access to all recordings" ON recordings
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Allow insert for authenticated users" ON recordings;
      CREATE POLICY "Allow insert for authenticated users" ON recordings
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow update for authenticated users" ON recordings;
      CREATE POLICY "Allow update for authenticated users" ON recordings
        FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Allow delete for authenticated users" ON recordings;
      CREATE POLICY "Allow delete for authenticated users" ON recordings
        FOR DELETE USING (true);
    `;

    // Ejecutar el SQL usando rpc
    console.log('📡 Ejecutando SQL en Supabase...');
    const { data, error } = await supabaseDirect.request('rpc/exec_sql', {
      method: 'POST',
      body: { sql: createTableSQL }
    });

    if (error) {
      console.error('❌ Error al crear tabla:', error);
      return false;
    }

    console.log('✅ Tabla recordings creada exitosamente');
    console.log('📊 Datos de respuesta:', data);
    return true;

  } catch (error) {
    console.error('❌ Error en createRecordingsTable:', error);
    return false;
  }
}

async function checkTableExists() {
  try {
    console.log('🔍 Verificando si la tabla recordings existe...');
    // Intentar hacer una consulta simple para verificar si existe
    const { data, error } = await supabaseDirect.request('recordings?select=id&limit=1');
    
    if (error && error.code === 'PGRST116') {
      console.log('📊 Tabla recordings no existe');
      return false;
    }
    
    if (error && error.message && error.message.includes('relation "public.recordings" does not exist')) {
      console.log('📊 Tabla recordings no existe');
      return false;
    }

    if (error) {
      console.error('❌ Error verificando tabla:', error);
      return false;
    }

    console.log('✅ Tabla recordings ya existe');
    console.log('📊 Datos de muestra:', data);
    return true;
  } catch (error) {
    if (error.message && error.message.includes('relation "public.recordings" does not exist')) {
      console.log('📊 Tabla recordings no existe');
      return false;
    }
    console.error('❌ Error verificando tabla:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando creación de tabla recordings...\n');

  // Verificar si la tabla ya existe
  const exists = await checkTableExists();
  if (exists) {
    console.log('✅ La tabla recordings ya está creada');
    process.exit(0);
  }

  // Crear la tabla
  const success = await createRecordingsTable();
  
  if (success) {
    console.log('\n✅ Tabla recordings creada exitosamente');
    console.log('\n📋 Campos de la tabla:');
    console.log('- id: UUID (Primary Key)');
    console.log('- radio_id: TEXT (Foreign Key a radios)');
    console.log('- radio_name: TEXT');
    console.log('- radio_region: TEXT');
    console.log('- radio_city: TEXT');
    console.log('- filename: TEXT (Único)');
    console.log('- file_path: TEXT');
    console.log('- file_size: BIGINT');
    console.log('- duration_seconds: INTEGER');
    console.log('- recorded_at: TIMESTAMP WITH TIME ZONE');
    console.log('- created_at: TIMESTAMP WITH TIME ZONE');
    console.log('- updated_at: TIMESTAMP WITH TIME ZONE');
    console.log('- metadata: JSONB');
    console.log('- status: TEXT (active|archived|deleted)');
    console.log('\n🔐 RLS habilitado con políticas de seguridad');
  } else {
    console.log('\n❌ Error al crear la tabla recordings');
    process.exit(1);
  }
}

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});