#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk2Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔄 Conectando a Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function createRecordingsTable() {
  try {
    console.log('📝 Creando tabla recordings...');

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

    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (error) {
      console.error('❌ Error al crear tabla:', error);
      return;
    }

    console.log('✅ Tabla recordings creada exitosamente');
    
    // Verificar si la tabla existe
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'recordings');

    if (checkError) {
      console.error('❌ Error al verificar tabla:', checkError);
      return;
    }

    if (tableExists && tableExists.length > 0) {
      console.log('✅ Tabla recordings verificada y existe');
    } else {
      console.log('⚠️ La tabla podría no haberse creado correctamente');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
createRecordingsTable().then(() => {
  console.log('🎉 Proceso completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});