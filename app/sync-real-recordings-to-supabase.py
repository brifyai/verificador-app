#!/usr/bin/env python3
# Script para sincronizar las grabaciones reales del VPS a Supabase

import json
import requests
import sys
from datetime import datetime

VPS_URL = 'http://213.199.39.147:5000/api/recordings'
SUPABASE_SAVE_URL = 'http://localhost:3000/api/recordings-save'
AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0xIiwiZW1haWwiOiJhZG1pbkBvbmRhdmVyaWZpY2FkYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzMwOTc5NDUsImV4cCI6MTczNTY4OTk0NX0.5mCP92eSJXuKvQZ7Y8XBKhY8l6JqZ8l6JqZ8l6JqZ8l6Jq'

def sync_real_recordings_to_supabase():
    print("🔄 SINCRONIZANDO GRABACIONES REALES DEL VPS A SUPABASE")
    print("======================================================")
    
    try:
        # Paso 1: Obtener grabaciones reales del VPS
        print("📡 Obteniendo grabaciones reales del VPS...")
        
        response = requests.get(VPS_URL, headers={
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        })
        
        if response.status_code != 200:
            print(f"❌ Error del VPS: {response.status_code} {response.text}")
            return False
        
        vps_data = response.json()
        
        if 'recordings' not in vps_data or not vps_data['recordings']:
            print("⚠️ No hay grabaciones en el VPS para sincronizar")
            return False
        
        recordings_count = len(vps_data['recordings'])
        print(f"✅ Grabaciones obtenidas del VPS: {recordings_count}")
        
        # Paso 2: Procesar cada grabación real
        print("\n📋 Procesando grabaciones reales...")
        
        for i, recording in enumerate(vps_data['recordings']):
            print(f"\n{i + 1}. Procesando: {recording['filename']}")
            
            try:
                # Extraer datos de la grabación real
                recording_data = {
                    'radio_id': recording.get('radio_id', 'unknown'),
                    'radio_name': recording.get('radio_name', f'Radio {recording.get("radio_id", "unknown")}'),
                    'radio_region': recording.get('radio_region', 'Región no especificada'),
                    'radio_city': recording.get('radio_city', 'Ciudad no especificada'),
                    'radio_programadora': recording.get('radio_programadora', ''),
                    'filename': recording['filename'],
                    'file_path': recording.get('path', recording.get('file_path', recording['filename'])),
                    'file_size': recording.get('size', recording.get('file_size', 0)),
                    'duration_seconds': recording.get('duration_seconds', 0),
                    'recorded_at': recording.get('created_at', datetime.utcnow().isoformat() + 'Z'),
                    'metadata': {
                        'source': 'vps_sync',
                        'original_path': recording.get('path'),
                        'vps_sync_date': datetime.utcnow().isoformat() + 'Z',
                        **recording.get('metadata', {})
                    }
                }
                
                # Paso 3: Guardar en Supabase
                print("   💾 Guardando en Supabase...")
                
                save_response = requests.post(SUPABASE_SAVE_URL, 
                    headers={
                        'Content-Type': 'application/json',
                        'Cookie': f'auth-token={AUTH_TOKEN}'
                    },
                    json=recording_data
                )
                
                if save_response.status_code == 200:
                    result = save_response.json()
                    print(f"   ✅ Grabación guardada exitosamente: {result.get('message', 'OK')}")
                else:
                    error_msg = save_response.json().get('message', 'Error desconocido') if save_response.text else 'Error desconocido'
                    print(f"   ❌ Error guardando: {error_msg}")
                
            except Exception as e:
                print(f"   ❌ Error procesando grabación: {str(e)}")
        
        print('\n✅ SINCRONIZACIÓN COMPLETA')
        print(f'📊 Total de grabaciones procesadas: {recordings_count}')
        return True
        
    except Exception as e:
        print(f'❌ Error en sincronización: {str(e)}')
        return False

if __name__ == '__main__':
    success = sync_real_recordings_to_supabase()
    sys.exit(0 if success else 1)