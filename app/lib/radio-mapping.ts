/**
 * Mapeo de radios del frontend a IDs del VPS
 * Soluciona el error HTTP 500 "Radio no encontrada"
 * 
 * IMPORTANTE: Usar estos IDs exactos del VPS para grabar
 */

export const RADIO_MAPPING: Record<string, number> = {
  // Radio Contagio Petorca
  'radio_contagio_real': 80,
  
  // Radio Somos Petorca  
  'radio_somos_petorca': 85,
  
  // Digital FM Arica
  'radio_digital_fm_arica': 2,
  
  // Radio Pilmaiquen (si existe)
  'radio_pilmaiquen': 189, // Dulce en Petorca
  
  // Radio Quiero (si existe)
  'radio_quiero': 189, // Dulce en Petorca (misma ciudad)
};

/**
 * Obtiene el ID del VPS para una radio del frontend
 * @param frontendId - ID de la radio en el frontend
 * @returns ID de la radio en el VPS
 */
export function getVPSRadioId(frontendId: string): number {
  return RADIO_MAPPING[frontendId] || parseInt(frontendId) || 2; // Default a Digital FM Arica
}

/**
 * Verifica si una radio existe en el mapeo
 * @param frontendId - ID de la radio en el frontend
 * @returns true si existe en el mapeo
 */
export function hasVPSEquivalent(frontendId: string): boolean {
  return frontendId in RADIO_MAPPING;
}

/**
 * Obtiene información de depuración sobre el mapeo
 * @param frontendId - ID de la radio en el frontend
 * @returns información de depuración
 */
export function getMappingDebugInfo(frontendId: string) {
  const vpsId = getVPSRadioId(frontendId);
  const hasMapping = hasVPSEquivalent(frontendId);
  
  return {
    frontendId,
    vpsId,
    hasMapping,
    isUsingDefault: !hasMapping && vpsId === 2,
    isValidNumber: !isNaN(vpsId) && vpsId > 0
  };
}

// Información de las radios mapeadas para referencia
export const MAPPED_RADIOS_INFO = {
  80: { name: 'Contagio', city: 'COELEMU', stream: 'https://sonic.streamingchilenos.com:7114/' },
  85: { name: 'Somos', city: 'PETORCA', stream: 'https://streaming1.tecnoera.com:8227/' },
  2: { name: 'Digital', city: 'Arica', stream: 'https://radio.digitalfm.cl:8000/arica' },
  189: { name: 'Dulce', city: 'PETORCA', stream: 'https://stream.zeno.fm/uftblekcpxguv' },
};

// Exportar tipo para TypeScript
export type RadioMapping = typeof RADIO_MAPPING;