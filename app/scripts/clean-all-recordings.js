#!/usr/bin/env node

/**
 * Script para limpiar COMPLETAMENTE todas las grabaciones
 * Tanto del VPS como de Supabase
 */

import axios from 'axios';

// Configuración del VPS
const VPS_URL = 'http://213.199.39.147:5000';

// Configuración de Supabase (usando credenciales directas)
const SUPABASE_URL = 'https://qvdnepdcgzhadvaktdhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2ZG5lcGRjZ3poYWR2YWt0ZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI0NzQsImV4cCI6MjA0ODU0ODQ3NH0.4U2uxC8eQqXJ3kMJlCJtMDhLHEt8f2mYxmdOxmLBnP0';

class SupabaseDirectClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.url}/rest/v1${endpoint}`;
    const headers = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error en request a ${endpoint}:`, error.message);
      throw error;
    }
  }
}

async function cleanVPSRecordings() {
  console.log('🗑️  Limpiando grabaciones del VPS...');
  
  try {
    // Obtener lista de grabaciones actuales
    const response = await axios.get(`${VPS_URL}/api/recordings`);
    const recordings = response.data.recordings || [];
    
    console.log(`📊 Encontradas ${recordings.length} grabaciones en el VPS`);
    
    // Eliminar cada grabación
    for (const recording of recordings) {
      try {
        await axios.delete(`${VPS_URL}/api/recordings/${recording.id}`);
        console.log(`✅ Eliminada grabación: ${recording.filename}`);
      } catch (error) {
        console.log(`⚠️  Error al eliminar ${recording.filename}: ${error.message}`);
      }
    }
    
    console.log('✅ Limpieza del VPS completada');
  } catch (error) {
    console.log(`⚠️  Error limpiando VPS: ${error.message}`);
  }
}

async function cleanSupabaseRecordings() {
  console.log('🗑️  Limpiando grabaciones de Supabase...');
  
  const client = new SupabaseDirectClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Obtener todas las grabaciones
    const recordings = await client.request('/recordings?select=id,filename');
    console.log(`📊 Encontradas ${recordings.length} grabaciones en Supabase`);
    
    // Eliminar cada grabación
    for (const recording of recordings) {
      try {
        await client.request(`/recordings?id=eq.${recording.id}`, {
          method: 'DELETE'
        });
        console.log(`✅ Eliminada grabación de Supabase: ${recording.filename}`);
      } catch (error) {
        console.log(`⚠️  Error al eliminar ${recording.filename}: ${error.message}`);
      }
    }
    
    console.log('✅ Limpieza de Supabase completada');
  } catch (error) {
    console.log(`⚠️  Error limpiando Supabase: ${error.message}`);
  }
}

async function main() {
  console.log('🧹 INICIANDO LIMPIEZA COMPLETA DEL SISTEMA DE GRABACIONES');
  console.log('========================================================');
  
  try {
    await cleanVPSRecordings();
    await cleanSupabaseRecordings();
    
    console.log('\n🎉 ¡LIMPIEZA COMPLETA FINALIZADA!');
    console.log('El sistema está listo para comenzar de cero.');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanVPSRecordings, cleanSupabaseRecordings };