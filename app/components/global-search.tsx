'use client';

import { useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GlobalSearch() {
  const {
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    isLoading,
    groupedResults,
    navigateToResult,
    getCategoryIcon,
    getCategoryName,
    hasResults
  } = useGlobalSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manejar teclas de acceso rápido
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para abrir búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape para cerrar
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen, setSearchTerm]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative flex-1 max-w-md ml-16 md:ml-0" ref={containerRef}>
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar... (Ctrl+K)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Estado de carga */}
          {isLoading && (
            <div className="p-4 text-center text-slate-400">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Buscando...
            </div>
          )}

          {/* Sin resultados */}
          {!isLoading && searchTerm && !hasResults && (
            <div className="p-4 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron resultados para "{searchTerm}"</p>
              <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
            </div>
          )}

          {/* Sugerencias cuando no hay término de búsqueda */}
          {!searchTerm && (
            <div className="p-4">
              <p className="text-sm text-slate-400 mb-3">Búsquedas sugeridas:</p>
              <div className="space-y-2">
                {[
                  { term: 'Radio Nacional', category: 'radios' },
                  { term: 'Coca-Cola', category: 'reportes' },
                  { term: 'sesiones activas', category: 'monitoreo' },
                  { term: 'audios recientes', category: 'audios' }
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(suggestion.term)}
                    className="flex items-center w-full p-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors"
                  >
                    <span className="mr-2">{getCategoryIcon(suggestion.category)}</span>
                    <span>{suggestion.term}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {getCategoryName(suggestion.category)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados agrupados */}
          {!isLoading && hasResults && (
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {Object.entries(groupedResults).map(([category, results]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="flex items-center px-2 py-1 mb-2">
                      <span className="mr-2">{getCategoryIcon(category)}</span>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        {getCategoryName(category)}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {results.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => navigateToResult(result)}
                          className="flex items-center w-full p-3 text-left hover:bg-slate-700 rounded-lg transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <h4 className="text-sm font-medium text-white truncate">
                                {result.title}
                              </h4>
                              {result.metadata && (
                                <div className="flex items-center ml-2 space-x-1">
                                  {Object.entries(result.metadata).slice(0, 2).map(([key, value]) => (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                      {String(value)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {result.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors ml-2 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer con atajos de teclado */}
          <div className="border-t border-slate-700 p-2 bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Presiona Enter para ir al primer resultado</span>
              <div className="flex items-center space-x-2">
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">↑↓</kbd>
                <span>navegar</span>
                <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Esc</kbd>
                <span>cerrar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}