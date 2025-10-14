'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface PhraseMatch {
  matchedText: string;
  confidence: number;
  position: number;
  wordPosition: number;
  context: string;
}

interface PhraseDetection {
  phrase: string;
  brand: string;
  campaign?: string;
  matches: PhraseMatch[];
}

interface DetectionResult {
  folderName: string;
  folderPath: string;
  timestamp: string;
  totalMatches: number;
  detections: PhraseDetection[];
  recordingDate: string;
}

interface DetectionsData {
  total: number;
  returned: number;
  totalMatches: number;
  phraseStats: Array<{
    phrase: string;
    brand: string;
    count: number;
  }>;
  detections: DetectionResult[];
}

export default function AutomaticDetectionsViewer() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DetectionsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadDetections = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/phrases/detections?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Error al cargar detecciones');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetections();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDetections();
      }, 30000); // Cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateFrom, dateTo]);

  const toggleExpanded = (folderName: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedResults(newExpanded);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600 bg-green-50';
    if (confidence >= 0.85) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detecciones Automáticas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Frases detectadas automáticamente después de cada transcripción
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDetections}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Actualizar
                </>
              )}
            </button>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-actualizar</span>
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Grabaciones Analizadas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.total}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Coincidencias</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {data.totalMatches}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Frases Diferentes</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {data.phraseStats.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Estadísticas por Frase */}
          {data.phraseStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Frases Más Detectadas
              </h3>
              <div className="space-y-2">
                {data.phraseStats.slice(0, 10).map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{stat.phrase}</p>
                      <p className="text-sm text-gray-600">{stat.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stat.count}</p>
                      <p className="text-xs text-gray-500">detecciones</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados Detallados */}
          {data.detections.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detecciones Recientes ({data.returned})
              </h3>
              <div className="space-y-4">
                {data.detections.map((result) => (
                  <div
                    key={result.folderName}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleExpanded(result.folderName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">{result.folderName}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDate(result.recordingDate)}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {result.totalMatches} coincidencia{result.totalMatches !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl text-gray-400">
                          {expandedResults.has(result.folderName) ? '−' : '+'}
                        </div>
                      </div>
                    </div>

                    {/* Detalles */}
                    {expandedResults.has(result.folderName) && (
                      <div className="p-4 space-y-3 bg-white">
                        {result.detections.map((detection, idx) => (
                          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{detection.phrase}</p>
                                <p className="text-sm text-gray-600">{detection.brand}</p>
                                {detection.campaign && (
                                  <p className="text-xs text-gray-500">Campaña: {detection.campaign}</p>
                                )}
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {detection.matches.length} vez/veces
                              </span>
                            </div>
                            {detection.matches.map((match, matchIdx) => (
                              <div key={matchIdx} className="mt-2 pl-4 border-l-2 border-gray-200">
                                <div className="bg-gray-50 rounded p-3 mb-2">
                                  <p className="text-sm text-gray-700 italic">{match.context}</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                                      match.confidence
                                    )}`}
                                  >
                                    {(match.confidence * 100).toFixed(0)}% confianza
                                  </span>
                                  <span>Palabra: {match.wordPosition}</span>
                                  <span>Carácter: {match.position}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No hay detecciones automáticas
              </p>
              <p className="text-sm text-gray-600">
                Las detecciones aparecerán automáticamente después de cada transcripción
              </p>
            </div>
          )}
        </>
      )}

      {/* Estado inicial */}
      {!data && !isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Detecciones Automáticas
          </p>
          <p className="text-sm text-gray-600">
            Cargando detecciones...
          </p>
        </div>
      )}
    </div>
  );
}
