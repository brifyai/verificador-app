'use client';

import { useState } from 'react';
import PhraseSearchResults from '@/components/phrase-search-results';
import AutomaticDetectionsViewer from '@/components/automatic-detections-viewer';

export default function BusquedaFrasesPage() {
  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('automatic');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('automatic')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'automatic'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Detecciones Automáticas</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Frases detectadas automáticamente después de cada transcripción
              </p>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Búsqueda Manual</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Buscar frases específicas en todas las transcripciones
              </p>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'automatic' ? (
          <AutomaticDetectionsViewer />
        ) : (
          <PhraseSearchResults />
        )}
      </div>
    </div>
  );
}
