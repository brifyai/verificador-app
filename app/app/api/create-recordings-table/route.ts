import { NextRequest, NextResponse } from 'next/server';
import { supabaseDirect } from '@/lib/supabase-direct';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creando tabla recordings en Supabase...');
    
    // Temporalmente permitir acceso sin autenticación para crear la tabla
    console.log('⚠️ Acceso temporal sin autenticación para crear tabla');

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
    const { data, error } = await supabaseDirect.request('rpc/exec_sql', {
      method: 'POST',
      body: { sql: createTableSQL }
    });

    if (error) {
      console.error('❌ Error al crear tabla:', error);
      return NextResponse.json(
        { error: 'Error al crear tabla recordings', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Tabla recordings creada exitosamente');
    
    return NextResponse.json({
      success: true,
      message: 'Tabla recordings creada exitosamente',
      data: data
    });

  } catch (error) {
    console.error('❌ Error en createRecordingsTable:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar si la tabla existe
    const { data, error } = await supabaseDirect.request('recordings?select=id&limit=1');
    
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({
        exists: false,
        message: 'La tabla recordings no existe'
      });
    }
    
    if (error && error.message.includes('relation "public.recordings" does not exist')) {
      return NextResponse.json({
        exists: false,
        message: 'La tabla recordings no existe'
      });
    }

    if (error) {
      console.error('❌ Error verificando tabla:', error);
      return NextResponse.json(
        { error: 'Error verificando tabla', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: true,
      message: 'La tabla recordings ya existe',
      data: data
    });

  } catch (error) {
    if (error instanceof Error && error.message && error.message.includes('relation "public.recordings" does not exist')) {
      return NextResponse.json({
        exists: false,
        message: 'La tabla recordings no existe'
      });
    }
    console.error('❌ Error verificando tabla:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}