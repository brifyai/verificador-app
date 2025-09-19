
export interface RadioDetection {
  id: string;
  date: string;
  time: string;
  programadora: string;
  radio: string;
  region: string;
  comuna: string;
  marca: string;
  campaña: string;
  status: 'Finalizada' | 'Replay' | 'Solucionado' | 'Lider' | 'Enviado' | 'Pendiente';
}

export interface Phrase {
  id: string;
  phrase: string;
  marca: string;
  campaña: string;
  active: boolean;
  uploaded: string;
}

export interface VerificationItem {
  id: string;
  phrase: string;
  marca: string;
  campaña: string;
  uploaded: string;
}

export type StreamPlatform = 
  // Plataformas Sociales y Video
  'youtube' | 'twitch' | 'facebook' | 'instagram' | 'tiktok' | 'spotify' | 'soundcloud' | 'mixcloud' |
  // Tecnología Base
  'icecast' | 'direct' |
  // Paneles de Control Profesionales
  'centova' | 'sonicpanel' | 'azuracast' | 'whmsonic' |
  // Proveedores Chilenos
  'arkeo' | 'creattiva' | 'visualradio' | 'mediaweb' | 'digitalproserver' | 'tustreaming' | 'streaminghd' | 'neonetwork' | 'chiloestreaming' |
  // Monetización y Analytics
  'afstream' | 'mediastream' |
  // Agregadores
  'tunein' |
  // Automatización
  'hardata' | 'infinystream' | 'radionomy' |
  // Globales
  'shoutcheap' | 'yesstreaming' | 'streamerr' |
  // Personalizado
  'custom';

export interface Radio {
  id: string;
  name: string;
  programadora: string;
  frequency: string;
  streamUrl: string;
  streamPlatform: StreamPlatform;
  platformData?: {
    channelId?: string;
    roomId?: string;
    userId?: string;
    playlistId?: string;
    embedId?: string;
    stationId?: string;
    panelType?: string;
    monetized?: boolean;
    audiometrix?: boolean;
    localProvider?: boolean;
    [key: string]: any; // Para flexibilidad futura
  };
  region: string;
  city: string;
  website?: string;
  isActive: boolean;
  lastMonitored?: string;
  genre: string;
  // Campos de valorización
  pricePerDetection?: number; // Precio actual por detección en CLP
  pricingRuleId?: string; // ID de la regla de precio asignada
  priceHistory?: PriceHistory[]; // Historial de cambios de precio
}

export interface PriceHistory {
  id: string;
  radioId: string;
  pricePerDetection: number;
  effectiveDate: string;
  endDate?: string;
  pricingRuleId?: string;
  appliedRetroactively?: boolean;
  retroactiveFromDate?: string;
  createdAt: string;
  createdBy: string;
  reason?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'Activo' | 'Inactivo';
}

export const mockRadioDetections: RadioDetection[] = [
  {
    id: '1',
    date: '03/09/2025',
    time: '14:30',
    programadora: 'Radio Pauta',
    radio: 'Radio Pauta',
    region: 'Metropolitana',
    comuna: 'Santiago',
    marca: 'Coca-Cola',
    campaña: 'Verano 2025',
    status: 'Finalizada'
  },
  {
    id: '2', 
    date: '03/09/2025',
    time: '15:45',
    programadora: 'Universidad de Chile',
    radio: 'Radio Universidad de Chile',
    region: 'Metropolitana',
    comuna: 'Santiago',
    marca: 'Entel',
    campaña: 'Conectados',
    status: 'Replay'
  },
  {
    id: '3',
    date: '03/09/2025', 
    time: '16:20',
    programadora: 'Cooperativa',
    radio: 'Radio Cooperativa',
    region: 'Valparaíso',
    comuna: 'Viña del Mar',
    marca: 'Falabella',
    campaña: 'Cyber Monday',
    status: 'Solucionado'
  },
  {
    id: '4',
    date: '03/09/2025',
    time: '17:10',
    programadora: 'Biobío',
    radio: 'Radio Biobío',
    region: 'Biobío',
    comuna: 'Concepción', 
    marca: 'Movistar',
    campaña: 'Internet Hogar',
    status: 'Lider'
  },
  {
    id: '5',
    date: '03/09/2025',
    time: '18:00',
    programadora: 'ADN',
    radio: 'Radio ADN',
    region: 'Antofagasta',
    comuna: 'Antofagasta',
    marca: 'Ripley',
    campaña: 'Back to School',
    status: 'Enviado'
  },
  {
    id: '6',
    date: '03/09/2025',
    time: '19:15',
    programadora: 'Concierto',
    radio: 'Radio Concierto', 
    region: 'Valparaíso',
    comuna: 'Valparaíso',
    marca: 'BancoEstado',
    campaña: 'Cuenta Vista',
    status: 'Pendiente'
  },
  {
    id: '7',
    date: '02/09/2025',
    time: '20:30',
    programadora: 'Pudahuel',
    radio: 'Radio Pudahuel',
    region: 'Metropolitana',
    comuna: 'Pudahuel',
    marca: 'Claro',
    campaña: 'Plan Familia',
    status: 'Finalizada'
  },
  {
    id: '8',
    date: '02/09/2025',
    time: '21:45',
    programadora: 'La Tercera',
    radio: 'Radio La Tercera',
    region: 'Metropolitana',
    comuna: 'Las Condes',
    marca: 'Santander',
    campaña: 'Crédito Hipotecario',
    status: 'Replay'
  }
];

export const mockPhrases: Phrase[] = [
  {
    id: '1',
    phrase: 'Coca-Cola, destapa la felicidad',
    marca: 'Coca-Cola',
    campaña: 'Verano 2025',
    active: true,
    uploaded: '01/09/2025'
  },
  {
    id: '2',
    phrase: 'Entel, siempre conectados',
    marca: 'Entel', 
    campaña: 'Conectados',
    active: true,
    uploaded: '28/08/2025'
  },
  {
    id: '3',
    phrase: 'Falabella, todo lo que necesitas',
    marca: 'Falabella',
    campaña: 'Cyber Monday',
    active: false,
    uploaded: '25/08/2025'
  },
  {
    id: '4',
    phrase: 'Movistar, muévete por más',
    marca: 'Movistar',
    campaña: 'Internet Hogar', 
    active: true,
    uploaded: '22/08/2025'
  }
];

export const mockVerificationItems: VerificationItem[] = [
  {
    id: '1',
    phrase: 'Ripley, más por menos',
    marca: 'Ripley',
    campaña: 'Back to School',
    uploaded: '03/09/2025'
  },
  {
    id: '2',
    phrase: 'BancoEstado, el banco de todos los chilenos',
    marca: 'BancoEstado', 
    campaña: 'Cuenta Vista',
    uploaded: '03/09/2025'
  }
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    email: 'carlos@aintelligence.cl',
    role: 'Administrador',
    lastLogin: '03/09/2025 18:30',
    status: 'Activo'
  },
  {
    id: '2', 
    name: 'María González',
    email: 'maria@aintelligence.cl',
    role: 'Verificador',
    lastLogin: '03/09/2025 17:45',
    status: 'Activo'
  },
  {
    id: '3',
    name: 'Pedro Silva',
    email: 'pedro@aintelligence.cl', 
    role: 'Analista',
    lastLogin: '02/09/2025 16:20',
    status: 'Inactivo'
  }
];

export const getDashboardMetrics = () => {
  const today = new Date().toLocaleDateString('es-CL');
  const todayDetections = mockRadioDetections.filter(d => d.date === '03/09/2025');
  const completedToday = todayDetections.filter(d => d.status === 'Finalizada' || d.status === 'Solucionado');
  const monitoredRadios = [...new Set(mockRadioDetections.map(d => d.radio))].length;
  
  return {
    detectionsToday: todayDetections.length,
    completedToday: completedToday.length, 
    monitoredRadios: monitoredRadios,
    totalDetections: mockRadioDetections.length
  };
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Finalizada': return 'bg-green-500';
    case 'Solucionado': return 'bg-orange-500';
    case 'Replay': return 'bg-yellow-500';
    case 'Lider': return 'bg-purple-500';
    case 'Enviado': return 'bg-blue-500';
    case 'Pendiente': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

export const mockRadios: Radio[] = [
  // Región Metropolitana  
  {
    id: '1',
    name: 'Radio Agricultura',
    programadora: 'Radio Agricultura',
    frequency: '92.1 FM',
    streamUrl: 'https://archi-us.digitalproserver.com/agrupariv.aac',
    streamPlatform: 'digitalproserver',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.radioagricultura.cl',
    isActive: true,
    lastMonitored: '03/09/2025 18:00',
    genre: 'Noticias',
    // Valorización
    pricePerDetection: 1500, // CLP
    pricingRuleId: '1',
    priceHistory: [
      {
        id: 'ph1',
        radioId: '1',
        pricePerDetection: 1500,
        effectiveDate: '2025-09-01',
        pricingRuleId: '1',
        createdAt: '2025-09-01T10:00:00Z',
        createdBy: 'admin',
        reason: 'Precio inicial para radio premium'
      }
    ]
  },
  {
    id: '0',
    name: 'Radio Demo (Música Clásica)',
    programadora: 'Demo',
    frequency: '88.0 FM',
    streamUrl: 'http://stream.radioparadise.com/aac-320',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://demo.radio',
    isActive: true,
    lastMonitored: '03/09/2025 19:00',
    genre: 'Música',
    // Valorización
    pricePerDetection: 800, // CLP
    pricingRuleId: '2'
  },
  {
    id: '00',
    name: 'Radio Test (Jazz)',
    programadora: 'Demo',
    frequency: '88.1 FM',
    streamUrl: 'http://streaming.radionacional.gov.ar:8000/rn_clasica',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://demo.radio',
    isActive: true,
    lastMonitored: '03/09/2025 19:00',
    genre: 'Jazz'
  },
  {
    id: '2',
    name: 'Radio Cooperativa',
    programadora: 'Radio Cooperativa',
    frequency: '93.3 FM',
    streamUrl: 'https://stream.zeno.fm/syyh7ma6hzzuv?zs=QXnmW6LhTGSp6wGUHHMelw',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.cooperativa.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:45',
    genre: 'Noticias'
  },
  {
    id: '3',
    name: 'Radio Biobío',
    programadora: 'Radio Biobío',
    frequency: '94.5 FM',
    streamUrl: 'https://stream.zeno.fm/f3c55d5d8c9gu?zs=JBBJdFjRTGGhKc0CjRD4lw',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.biobiochile.cl',
    isActive: true,
    lastMonitored: '03/09/2025 18:15',
    genre: 'Noticias'
  },
  {
    id: '4',
    name: 'Radio Universidad de Chile',
    programadora: 'Universidad de Chile',
    frequency: '102.5 FM',
    streamUrl: 'https://stream.zeno.fm/mha2td7dt18uv?zs=zKnF3FelSr6p9CmPgP_UJw',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://radio.uchile.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:30',
    genre: 'Cultural'
  },
  {
    id: '5',
    name: 'Radio ADN',
    programadora: 'Radio ADN',
    frequency: '91.7 FM',
    streamUrl: 'https://stream.zeno.fm/z8q5v4p2hzzuv?zs=qMF5aTzOQOG9_8LGfXpN-A',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.adnradio.cl',
    isActive: true,
    lastMonitored: '03/09/2025 18:00',
    genre: 'Noticias'
  },
  {
    id: '6',
    name: 'Radio Concierto',
    programadora: 'Radio Concierto',
    frequency: '88.5 FM',
    streamUrl: 'https://stream.zeno.fm/dgqf2nev7tzuv?zs=OZKlN4uQR3S8X-PG8x17vw',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.concierto.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:20',
    genre: 'Música'
  },
  {
    id: '7',
    name: 'Radio Rock & Pop',
    programadora: 'Rock & Pop',
    frequency: '94.1 FM',
    streamUrl: 'https://stream.zeno.fm/n8bb7me6hzzuv?zs=2RqFX8i8TKywEWQV9ZL9fg',
    streamPlatform: 'icecast',
    region: 'Metropolitana',
    city: 'Santiago',
    website: 'https://www.rockandpop.cl',
    isActive: true,
    lastMonitored: '03/09/2025 18:10',
    genre: 'Música'
  },
  
  // Región de Valparaíso
  {
    id: '8',
    name: 'Radio Valparaíso',
    programadora: 'Radio Valparaíso',
    frequency: '103.5 FM',
    streamUrl: 'https://www.instagram.com/radiovalparaiso/live',
    streamPlatform: 'instagram', 
    platformData: {
      userId: 'radiovalparaiso'
    },
    region: 'Valparaíso',
    city: 'Valparaíso',
    website: 'https://www.radiovalparaiso.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:50',
    genre: 'Música'
  },
  {
    id: '9',
    name: 'Radio Bío-Bío Valparaíso',
    programadora: 'Radio Biobío',
    frequency: '96.9 FM',
    streamUrl: 'https://www.tiktok.com/@biobiovalpo/live',
    streamPlatform: 'tiktok',
    platformData: {
      userId: 'biobiovalpo'
    },
    region: 'Valparaíso',
    city: 'Valparaíso',
    isActive: true,
    lastMonitored: '03/09/2025 17:55',
    genre: 'Noticias'
  },
  
  // Región del Biobío
  {
    id: '10',
    name: 'Radio Bío-Bío Concepción',
    programadora: 'Radio Biobío',
    frequency: '96.5 FM',
    streamUrl: 'https://mixcloud.com/biobioconcepcion/live',
    streamPlatform: 'mixcloud',
    platformData: {
      userId: 'biobioconcepcion'
    },
    region: 'Biobío',
    city: 'Concepción',
    website: 'https://www.biobiochile.cl',
    isActive: true,
    lastMonitored: '03/09/2025 18:05',
    genre: 'Noticias'
  },
  {
    id: '11',
    name: 'Radio Universidad de Concepción',
    programadora: 'Universidad de Concepción',
    frequency: '100.5 FM',
    streamUrl: 'http://streaming.udec.cl:8000/radioudec.mp3',
    streamPlatform: 'direct',
    region: 'Biobío',
    city: 'Concepción',
    website: 'https://radio.udec.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:40',
    genre: 'Cultural'
  },
  
  // Región de Antofagasta
  {
    id: '12',
    name: 'Radio Antofagasta',
    programadora: 'Radio Antofagasta',
    frequency: '99.7 FM',
    streamUrl: 'https://radioantofagasta.cl/streaming/live.php',
    streamPlatform: 'custom',
    platformData: {
      embedId: 'radioantofagasta-player'
    },
    region: 'Antofagasta',
    city: 'Antofagasta',
    isActive: true,
    lastMonitored: '03/09/2025 17:35',
    genre: 'Música'
  },
  {
    id: '13',
    name: 'Radio Cooperativa Antofagasta',
    programadora: 'Radio Cooperativa',
    frequency: '91.3 FM',
    streamUrl: 'http://streaming.cooperativa.cl:8000/antofagasta.aac',
    streamPlatform: 'icecast',
    region: 'Antofagasta',
    city: 'Antofagasta',
    isActive: true,
    lastMonitored: '03/09/2025 18:00',
    genre: 'Noticias'
  },
  
  // Región de La Araucanía
  {
    id: '14',
    name: 'Radio Frontera',
    programadora: 'Radio Frontera',
    frequency: '92.1 FM',
    streamUrl: 'https://centova.arkeo.cl:8443/stream',
    streamPlatform: 'arkeo',
    platformData: {
      panelType: 'centova'
    },
    region: 'La Araucanía',
    city: 'Temuco',
    website: 'https://www.radiofrontera.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:25',
    genre: 'Música'
  },
  {
    id: '15',
    name: 'Radio Universidad de La Frontera',
    programadora: 'UFRO',
    frequency: '89.9 FM',
    streamUrl: 'https://azura.ufro.cl/radio/8000/radio.mp3',
    streamPlatform: 'azuracast',
    platformData: {
      stationId: 'ufro-radio'
    },
    region: 'La Araucanía',
    city: 'Temuco',
    website: 'https://radio.ufro.cl',
    isActive: true,
    lastMonitored: '03/09/2025 17:45',
    genre: 'Cultural'
  },

  // Ejemplos adicionales con nuevas plataformas
  {
    id: '16',
    name: 'Radio TuneIn Nacional',
    programadora: 'Agregador Internacional',
    frequency: 'Online',
    streamUrl: 'https://tunein.com/radio/radio-chile-s123456/',
    streamPlatform: 'tunein',
    platformData: {
      stationId: 'radio-chile-s123456'
    },
    region: 'Metropolitana',
    city: 'Santiago',
    isActive: true,
    lastMonitored: '03/09/2025 18:00',
    genre: 'Noticias'
  },
  {
    id: '17',
    name: 'Radio Monetizada',
    programadora: 'AF Stream',
    frequency: '100.1 FM',
    streamUrl: 'https://stream.afstream.com/radio-chile',
    streamPlatform: 'afstream',
    platformData: {
      monetized: true,
      audiometrix: true
    },
    region: 'Valparaíso',
    city: 'Viña del Mar',
    isActive: true,
    lastMonitored: '03/09/2025 17:55',
    genre: 'Música'
  },
  {
    id: '18',
    name: 'Radio Chiloé Digital',
    programadora: 'Chiloé Streaming',
    frequency: '95.5 FM',
    streamUrl: 'https://streaming.chiloestreaming.com:10997/',
    streamPlatform: 'chiloestreaming',
    platformData: {
      localProvider: true
    },
    region: 'Los Lagos',
    city: 'Castro',
    isActive: true,
    lastMonitored: '03/09/2025 17:30',
    genre: 'Cultural'
  }
];

export const chartData = {
  pressureAnalysis: [
    { month: 'Ene', detecciones: 45, completadas: 42 },
    { month: 'Feb', detecciones: 52, completadas: 48 },
    { month: 'Mar', detecciones: 48, completadas: 45 },
    { month: 'Abr', detecciones: 61, completadas: 58 },
    { month: 'May', detecciones: 55, completadas: 52 },
    { month: 'Jun', detecciones: 67, completadas: 63 },
    { month: 'Jul', detecciones: 72, completadas: 69 },
    { month: 'Ago', detecciones: 58, completadas: 55 },
    { month: 'Sep', detecciones: 34, completadas: 32 }
  ],
  statusDistribution: [
    { name: 'Finalizada', value: 45, color: '#22c55e' },
    { name: 'Solucionado', value: 25, color: '#f97316' },
    { name: 'Replay', value: 15, color: '#eab308' },
    { name: 'Lider', value: 10, color: '#a855f7' },
    { name: 'Enviado', value: 3, color: '#3b82f6' },
    { name: 'Pendiente', value: 2, color: '#6b7280' }
  ],
  regionAnalysis: [
    { region: 'Metropolitana', detecciones: 89 },
    { region: 'Valparaíso', detecciones: 67 },
    { region: 'Biobío', detecciones: 45 },
    { region: 'Antofagasta', detecciones: 23 },
    { region: 'La Araucanía', detecciones: 18 }
  ]
};
