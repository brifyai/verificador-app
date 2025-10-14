'use client';

import { useState } from 'react';
import { Search, FileText, Clock, MapPin, AlertCircle, CheckCircle, Loader2, Download, Filter } from 'lucide-react';

interface PhraseMatch {
  phraseId: string;
  phrase: string;
  brand: string;
  campaign?: string;
  matchedText: string;
  confidence: number;
  position: number;
  wordPosition: number;
  context: string;
}

interface TranscriptionSearchResult {
  folderName: string;
  folderPath: string;
  audioFile: string;
  transcriptionFile: string;
  transcriptionLength: number;
  wordCount: number;
  matches: PhraseMatch[];
  timestamp: string;
}

interface SearchSummary {
  totalFolders: number;
  foldersWithMatches: number;
  totalMatches: number;
  phraseStats: {
    phraseId: string;
    phrase: string;
    brand: string;
    matchCount: number;
  }[];
  results: TranscriptionSearchResult[];
}

interface PhraseSearchResultsProps {
  onSearch?: () => void;
}

export default function PhraseSearchResults({ onSearch }: PhraseSearchResultsProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch('/api/phrases/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseIds: selectedPhrases.length > 0 ? selectedPhrases : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        if (onSearch) onSearch();
      } else {
        setError(data.error || 'Error al realizar la búsqueda');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleExpanded = (folderName: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedResults(newExpanded);
  };

  const exportResults = () => {
    if (!searchResults) return;

    const dataStr = JSON.stringify(searchResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phrase-search-results-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600 bg-green-50';
    if (confidence >= 0.85) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Búsqueda de Frases en Transcripciones</h2>
            <p className="text-sm text-gray-600 mt-1">
              Busca frases clave en los archivos de transcripción y encuentra el momento exacto donde aparecen
            </p>
          </div>
          <Search className="w-8 h-8 text-blue-600" />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {searchResults && (
        <>
          {/* Estadísticas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Grabaciones</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {searchResults.totalFolders}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Con Coincidencias</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {searchResults.foldersWithMatches}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Coincidencias</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {searchResults.totalMatches}
                  </p>
                </div>
                <Search className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Frases Encontradas</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {searchResults.phraseStats.length}
                  </p>
                </div>
                <Filter className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Estadísticas por Frase */}
          {searchResults.phraseStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Frases Encontradas
                </h3>
                <button
                  onClick={exportResults}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
              <div className="space-y-2">
                {searchResults.phraseStats.map((stat) => (
                  <div
                    key={stat.phraseId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{stat.phrase}</p>
                      <p className="text-sm text-gray-600">{stat.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stat.matchCount}</p>
                      <p className="text-xs text-gray-500">coincidencias</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados Detallados */}
          {searchResults.results.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resultados Detallados ({searchResults.results.length})
              </h3>
              <div className="space-y-4">
                {searchResults.results.map((result) => (
                  <div
                    key={result.folderName}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Header del resultado */}
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
                                  {result.timestamp}
                                </span>
                                <span>{result.wordCount} palabras</span>
                                <span className="font-semibold text-blue-600">
                                  {result.matches.length} coincidencia{result.matches.length !== 1 ? 's' : ''}
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

                    {/* Detalles expandidos */}
                    {expandedResults.has(result.folderName) && (
                      <div className="p-4 space-y-3 bg-white">
                        {result.matches.map((match, idx) => (
                          <div
                            key={`${match.phraseId}-${idx}`}
                            className="border-l-4 border-blue-500 pl-4 py-2"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{match.phrase}</p>
                                <p className="text-sm text-gray-600">{match.brand}</p>
                                {match.campaign && (
                                  <p className="text-xs text-gray-500">Campaña: {match.campaign}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                                    match.confidence
                                  )}`}
                                >
                                  {(match.confidence * 100).toFixed(0)}% confianza
                                </span>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3 mb-2">
                              <p className="text-sm text-gray-700 italic">
                                {match.context}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Posición: palabra {match.wordPosition}
                              </span>
                              <span>Carácter: {match.position}</span>
                              {match.matchedText !== match.phrase && (
                                <span className="text-orange-600">
                                  Texto encontrado: "{match.matchedText}"
                                </span>
                              )}
                            </div>
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
                No se encontraron coincidencias
              </p>
              <p className="text-sm text-gray-600">
                No se encontraron frases en las transcripciones disponibles
              </p>
            </div>
          )}
        </>
      )}

      {/* Estado inicial */}
      {!searchResults && !isSearching && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Busca frases en transcripciones
          </p>
          <p className="text-sm text-gray-600">
            Haz clic en "Buscar" para encontrar frases clave en los archivos de transcripción
          </p>
        </div>
      )}
    </div>
  );
}
