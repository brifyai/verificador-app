#!/usr/bin/env python3
"""
Script para diagnosticar el problema de "Radio no encontrada" en el VPS
"""

import requests
import json

VPS_URL = "http://213.199.39.147:5000"

def test_radio_lookup():
    """Probar la búsqueda de radios en el VPS"""
    print("🔍 Diagnosticando problema de 'Radio no encontrada' en VPS")
    print("=" * 60)
    
    # 1. Obtener lista de radios del VPS
    print("\n1. Obteniendo radios del VPS...")
    try:
        response = requests.get(f"{VPS_URL}/api/radios")
        if response.status_code == 200:
            data = response.json()
            radios = data.get('radios', [])
            print(f"✅ Se encontraron {len(radios)} radios")
            
            # Mostrar algunas radios de ejemplo
            print("\nEjemplos de radios disponibles:")
            for i, radio in enumerate(radios[:5]):
                print(f"  - ID: {radio.get('id_radio')} | Nombre: {radio.get('name')} | Region: {radio.get('region')}")
            
            # Guardar primera radio para pruebas
            if radios:
                test_radio = radios[0]
                test_id = test_radio.get('id_radio')
                test_name = test_radio.get('name')
                print(f"\n🎯 Radio de prueba seleccionada: ID={test_id}, Nombre={test_name}")
            else:
                print("❌ No se encontraron radios")
                return
        else:
            print(f"❌ Error obteniendo radios: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error conectando al VPS: {e}")
        return
    
    # 2. Probar endpoint de verificación de stream
    print(f"\n2. Probando endpoint /api/verify-stream...")
    try:
        payload = {
            "radio_id": str(test_id),
            "stream_url": test_radio.get('stream_url'),
            "radio_name": test_name
        }
        
        response = requests.post(
            f"{VPS_URL}/api/verify-stream",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"❌ Error en verify-stream: {e}")
    
    # 3. Probar endpoint de start-recording
    print(f"\n3. Probando endpoint /api/start-recording...")
    try:
        payload = {
            "radio_id": str(test_id),
            "stream_url": test_radio.get('stream_url'),
            "duration": 3600
        }
        
        response = requests.post(
            f"{VPS_URL}/api/start-recording",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"❌ Error en start-recording: {e}")
    
    # 4. Probar con diferentes formatos de ID
    print(f"\n4. Probando diferentes formatos de radio_id...")
    test_formats = [
        str(test_id),      # "2"
        int(test_id),      # 2
        f"radio-{test_id}", # "radio-2"
        str(test_id).zfill(3) # "002"
    ]
    
    for format_id in test_formats:
        print(f"\n   Probando con radio_id={format_id} (tipo: {type(format_id).__name__})...")
        try:
            payload = {
                "radio_id": format_id,
                "stream_url": test_radio.get('stream_url'),
                "duration": 3600
            }
            
            response = requests.post(
                f"{VPS_URL}/api/start-recording",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            result = response.json()
            print(f"   Resultado: {result.get('status', 'unknown')} - {result.get('message', 'No message')}")
            
        except Exception as e:
            print(f"   Error: {e}")
    
    print("\n" + "=" * 60)
    print("Diagnóstico completado")

if __name__ == "__main__":
    test_radio_lookup()