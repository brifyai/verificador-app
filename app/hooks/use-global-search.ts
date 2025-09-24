'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'radios' | 'reportes' | 'audios' | 'monitoreo';
  url: string;
  metadata?: Record<string, any>;
}

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();

  // Simular datos para la búsqueda (en una app real, esto vendría de una API)
  const mockData = useMemo(() => [
    // Radios
    {
      id: 'radio-1',
      title: 'Radio Nacional',
      description: 'Emisora nacional con cobertura en todo el país',
      category: 'radios' as const,
      url: '/radios',
      metadata: { region: 'Nacional', genre: 'Noticias' }
    },
    {
      id: 'radio-2',
      title: 'FM Rock 101.5',
      description: 'La mejor música rock las 24 horas',
      category: 'radios' as const,
      url: '/radios',
      metadata: { region: 'Buenos Aires', genre: 'Rock' }
    },
    {
      id: 'radio-3',
      title: 'Radio Clásica',
      description: 'Música clásica y cultural',
      category: 'radios' as const,
      url: '/radios',
      metadata: { region: 'Córdoba', genre: 'Clásica' }
    },
    // Reportes
    {
      id: 'reporte-1',
      title: 'Detección Coca-Cola',
      description: 'Publicidad detectada en Radio Nacional - 15:30',
      category: 'reportes' as const,
      url: '/reportes',
      metadata: { brand: 'Coca-Cola', radio: 'Radio Nacional' }
    },
    {
      id: 'reporte-2',
      title: 'Campaña Samsung',
      description: 'Serie de anuncios detectados en múltiples emisoras',
      category: 'reportes' as const,
      url: '/reportes',
      metadata: { brand: 'Samsung', count: 5 }
    },
    // Audios
    {
      id: 'audio-1',
      title: 'Audio Publicitario - McDonald\'s',
      description: 'Grabación de 30 segundos detectada automáticamente',
      category: 'audios' as const,
      url: '/audios',
      metadata: { duration: '30s', brand: 'McDonald\'s' }
    },
    {
      id: 'audio-2',
      title: 'Jingle Banco Nación',
      description: 'Audio promocional institucional',
      category: 'audios' as const,
      url: '/audios',
      metadata: { duration: '15s', brand: 'Banco Nación' }
    },
    // Monitoreo
    {
      id: 'monitor-1',
      title: 'Sesión Activa - FM Rock',
      description: 'Monitoreo en tiempo real desde hace 2 horas',
      category: 'monitoreo' as const,
      url: '/monitoreo',
      metadata: { status: 'active', duration: '2h' }
    },
    {
      id: 'monitor-2',
      title: 'Alerta de Detección',
      description: 'Nueva publicidad detectada hace 5 minutos',
      category: 'monitoreo' as const,
      url: '/monitoreo',
      metadata: { status: 'alert', time: '5m ago' }
    }
  ], []);

  // Función de búsqueda
  const performSearch = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    return mockData.filter(item => 
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      Object.values(item.metadata || {}).some(value => 
        String(value).toLowerCase().includes(term)
      )
    );
  }, [searchTerm, mockData]);

  // Actualizar resultados cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      // Simular delay de API
      const timer = setTimeout(() => {
        setResults(performSearch);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [searchTerm, performSearch]);

  // Agrupar resultados por categoría
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    });
    return groups;
  }, [results]);

  // Navegar a un resultado
  const navigateToResult = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Obtener icono por categoría
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'radios': return '📻';
      case 'reportes': return '📊';
      case 'audios': return '🎵';
      case 'monitoreo': return '👁️';
      default: return '🔍';
    }
  };

  // Obtener nombre de categoría
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'radios': return 'Radios';
      case 'reportes': return 'Reportes';
      case 'audios': return 'Audios';
      case 'monitoreo': return 'Monitoreo';
      default: return 'Otros';
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    isLoading,
    results,
    groupedResults,
    navigateToResult,
    getCategoryIcon,
    getCategoryName,
    hasResults: results.length > 0
  };
}