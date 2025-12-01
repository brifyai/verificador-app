// Nombres estandarizados de regiones de Chile (sin acentos para consistencia)
export const REGION_NAMES = {
  'Arica y Parinacota': 'Arica y Parinacota',
  'Tarapacá': 'Tarapacá',
  'Antofagasta': 'Antofagasta',
  'Atacama': 'Atacama',
  'Coquimbo': 'Coquimbo',
  'Valparaíso': 'Valparaíso',
  'Metropolitana': 'Metropolitana',
  'O\'Higgins': 'O\'Higgins',
  'Maule': 'Maule',
  'Ñuble': 'Ñuble',
  'Biobío': 'Biobío',
  'Araucanía': 'Araucanía',
  'Los Ríos': 'Los Ríos',
  'Los Lagos': 'Los Lagos',
  'Aysén': 'Aysén',
  'Magallanes': 'Magallanes'
} as const;

// Orden de regiones de norte a sur
export const REGION_ORDER = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
];

// Función para normalizar nombres de regiones
export function normalizeRegionName(region: string | null | undefined): string {
  if (!region) return '';
  
  // Mapeo de nombres comunes a nombres estándar
  const regionMapping: { [key: string]: string } = {
    'bio bio': 'Biobío',
    'bio-bio': 'Biobío',
    'biobio': 'Biobío',
    'bío bío': 'Biobío',
    'la araucanía': 'Araucanía',
    'araucanía': 'Araucanía',
    'araucania': 'Araucanía',
    'magallanes y antartica': 'Magallanes',
    'magallanes': 'Magallanes'
  };
  
  // Convertir a minúsculas para el mapeo
  const lowerRegion = region.toLowerCase().trim();
  
  // Si existe en el mapeo, devolver el nombre estándar
  if (regionMapping[lowerRegion]) {
    return regionMapping[lowerRegion];
  }
  
  const normalized = region
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim();
  
  // Buscar coincidencia en los nombres estandarizados
  const found = Object.entries(REGION_NAMES).find(([key, value]) =>
    key.toLowerCase() === normalized.toLowerCase() ||
    value.toLowerCase() === normalized.toLowerCase()
  );
  
  return found ? found[1] : region; // Retornar el nombre estandarizado o el original si no se encuentra
}

// Función para obtener todas las regiones con sus nombres estandarizados
export function getAllRegions(): string[] {
  return [...REGION_ORDER];
}

// Función para mapear una región a su nombre estandarizado
export function mapToStandardRegionName(region: string | null | undefined): string {
  return normalizeRegionName(region);
}